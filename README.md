# Cafeteca — cuaderno de café filtrado

Guarda tus cafés, reconoce sus etiquetas por foto y lleva el historial de tus preparaciones para
poder repetir y comparar recetas.

**Stack:** Next.js 14 (App Router + TypeScript) · Supabase (Postgres + Storage) · OCR.space
(OCR de etiquetas) · Tailwind CSS.

Pensado para desplegarse gratis en **Vercel** (hosting) + **Supabase** (base de datos y fotos), sin
servidores propios. El OCR usa el plan gratuito de OCR.space y requiere una API key.

---

## 1. Requisitos

- Node.js 18.18 o superior.
- Una cuenta gratuita en [Supabase](https://supabase.com).
- Una API key de [OCR.space](https://ocr.space/ocrapi/freekey) para reconocer etiquetas.
- Una cuenta gratuita en [Vercel](https://vercel.com) si vas a desplegarla en internet.

## 2. Configurar Supabase (una sola vez)

1. Crea un proyecto nuevo en [supabase.com](https://supabase.com) (plan gratuito).
2. Ve a **SQL Editor** → pega el contenido de [`supabase/schema.sql`](./supabase/schema.sql) → **Run**.
   Esto crea desde cero las tablas `CAFES` y `PREPARACIONES`. No copia datos de las tablas anteriores `coffees` y `brews`; esas tablas quedan intactas y la app empezará con las tablas nuevas vacías.
3. Ve a **Storage** → **New bucket** → nombre `cafeteca-fotos` → **deja el bucket como privado** (no
   marques "Public bucket") → crear.
4. Ve a **Project Settings → API** y copia:
   - **Project URL** → la usarás como `SUPABASE_URL`.
   - **service_role** (en "Project API keys", es el secreto, no el `anon`) → `SUPABASE_SERVICE_ROLE_KEY`.

   ⚠️ La `service_role` key tiene acceso total a tu base de datos y tus archivos. Solo debe vivir en
   variables de entorno del servidor (tu `.env.local` o las variables de entorno de Vercel). Nunca la
   subas a un repositorio público ni la uses en código de cliente.

## 3. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local` y completa:

```
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ....
SUPABASE_PHOTOS_BUCKET=cafeteca-fotos
OCR_SPACE_API_KEY=tu_api_key_de_ocr_space
```

La API key de OCR.space se envía solo desde el servidor, en el encabezado `apikey`; nunca se incluye
en el código que descarga el navegador. No subas `.env.local` al repositorio.

## 4. Ejecutar en local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Otros comandos útiles:

```bash
npm run typecheck   # revisa tipos de TypeScript
npm run build       # build de producción (el mismo que usa Vercel)
npm run start        # sirve el build de producción en local
```

## 5. Desplegar gratis en Vercel

1. Sube este proyecto a un repositorio de GitHub (o GitLab/Bitbucket).
2. En [vercel.com](https://vercel.com) → **Add New → Project** → importa el repositorio.
3. En **Environment Variables** agrega las 4 variables del paso 3
   (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PHOTOS_BUCKET`, `OCR_SPACE_API_KEY`).
4. **Deploy**. Vercel detecta Next.js automáticamente, no hace falta configuración extra.
5. Cada vez que hagas `git push`, Vercel vuelve a desplegar automáticamente.

No hice ningún despliegue por ti: estos pasos los completas tú cuando quieras publicar la app.

### Límites del plan gratuito a tener en cuenta

- **Vercel (Hobby):** las funciones tienen límites de ejecución y tamaño de petición. El endpoint de
  reconocimiento espera hasta 45 segundos a OCR.space; revisa el límite vigente del plan de Vercel
  antes de desplegarlo allí.
- **Supabase (Free):** 500 MB de base de datos y 1 GB de Storage — de sobra para uso personal. Los
  proyectos gratuitos se **pausan tras una semana sin actividad**; si eso pasa, basta con entrar al
  panel de Supabase y reactivarlo (tus datos no se pierden).
- **OCR.space (plan gratuito):** la documentación indica un máximo de 1 MB por imagen y límites de
  solicitudes por día y por IP. La app rechaza imágenes mayores a 1 MB antes de enviarlas; comprime
  las fotos en el navegador, pero puede ser necesario recortar una etiqueta grande.

## 6. Cómo se guardan y protegen las fotos

- Las fotos se comprimen y, si lo pides, se recortan/giran en tu propio navegador antes de enviarse
  (nunca se sube el archivo original sin procesar).
- Se guardan en un **bucket privado** de Supabase Storage (no son accesibles públicamente por URL).
- La aplicación las sirve a través de su propia ruta interna (`/api/uploads/[archivo]`), que usa la
  clave secreta del servidor para descargarlas de Supabase y reenviarlas solo a quien tenga acceso a
  tu instancia de la app.
- Ten en cuenta que esta es una aplicación de un solo usuario, sin login: cualquiera con la URL de tu
  despliegue en Vercel puede ver los datos y las fotos. Si vas a compartir el enlace o desplegarla en
  un dominio público, considera añadir una protección (por ejemplo, la función "Password Protection"
  de Vercel, disponible en planes de pago, o una capa de autenticación propia) — no viene incluida.

## 7. Reconocimiento de etiquetas (OCR): qué esperar y cómo corregirlo

El reconocimiento envía la foto procesada a **OCR.space** desde una ruta del servidor y luego usa
un conjunto de reglas propias que buscan, dentro del texto leído,
patrones típicos de fichas de café: nombres de variedades conocidas (Pacamara, Red Bourbon, Castillo,
Caturra, Geisha/Gesha, Sudan Rume, etc.), palabras de proceso ("lavado/washed", "natural",
"anaeróbico/anaerobic", "honey"), países y departamentos/regiones cafeteros frecuentes, un patrón de
altitud ("1800 msnm"), palabras de perfil de taza (frutas, especias, chocolate, floral...) y nombres
de persona sin etiquetar (para detectar al productor aunque no diga "Productor:").

El OCR necesita conexión a internet y transmite la imagen a OCR.space. El proveedor devuelve texto y
coordenadas; la app no envía la API key al navegador. El análisis no "entiende" la etiqueta: compara
el texto reconocido contra listas y patrones conocidos, así que revisa siempre los campos propuestos.

**Qué tan bien funciona, según las pruebas que hice:**

- Con los 5 empaques de ejemplo del enunciado (Lohas Café y Soare Coffee), el reconocimiento de
  variedad, proceso, región, altitud, productor y notas de cata funcionó correctamente en todos los
  casos en mis pruebas con texto simulado.
- **La distinción entre "nombre del café" y "nombre del productor" es la parte más débil**: cuando
  ninguno de los dos viene etiquetado con una palabra ("Nombre:", "Productor:"), la app usa reglas
  (¿parece un nombre de persona? ¿es el texto más grande de la etiqueta?) para adivinar cuál es cuál,
  y puede equivocarse. Revisa siempre estos dos campos.
- **Municipios**: solo reconozco un conjunto acotado de departamentos/regiones cafeteras comunes
  (Colombia principalmente); nombres de municipios específicos casi nunca se detectan solos (sin la
  palabra "Municipio:" delante) porque hay demasiados para tener una lista completa. Ese campo
  probablemente lo completarás a mano casi siempre.
- **Calidad de la foto**: un OCR tradicional es sensible a fotos borrosas, con poco contraste o con
  tipografías decorativas/manuscritas.
  Usa "Girar" y "Recortar" para dejar el texto lo más horizontal y limpio posible antes de que la app
  lo analice; mejora notablemente el resultado.
- **Etiquetas muy minimalistas o en idiomas/variedades poco comunes** (fuera de las listas
  reconocidas) simplemente no completan esos campos — nunca se inventan datos, quedan vacíos para que
  los llenes tú.
- Si el análisis falla por completo (imagen corrupta, navegador sin soporte, etc.) puedes seguir
  creando el café normalmente completando los campos a mano.

**Cómo corregir:** todos los campos son editables en el mismo formulario antes de guardar, y también
después desde "Editar café". El texto crudo que devolvió OCR.space queda disponible en "Ver texto
leído de la etiqueta" para compararlo con la foto.

**¿Quieres reconocimiento más preciso más adelante?** Si en el futuro te interesa mejorar la precisión
(por ejemplo con una IA de visión de pago) el código está organizado para que sea sencillo:
`src/app/api/ocr/route.ts` llama a OCR.space y `src/lib/labelParser.ts` contiene la lógica de
heurísticas. Las llamadas pasan por `/api/ocr`; la clave permanece en el servidor.

## 8. Exportar / importar tus datos

En **Ajustes** puedes:

- Descargar un JSON con todos tus cafés y preparaciones (botón "Exportar todo").
- Volver a importarlo (por ejemplo, tras mover la app a otro proyecto de Supabase). Importar es
  seguro de repetir: los registros con el mismo id se actualizan en vez de duplicarse.

**Importante:** esa exportación incluye los datos de texto/números, **no las fotos** (que viven en
Supabase Storage). Si quieres respaldar también las fotos, descárgalas desde el panel de Supabase
(Storage → bucket `cafeteca-fotos`) o mantén el mismo proyecto de Supabase como respaldo principal.

## 9. Datos de ejemplo

En **Ajustes** puedes agregar un café de ejemplo (claramente marcado con la etiqueta "ejemplo" en
toda la app) para ver cómo luce la aplicación con contenido, y eliminarlo en cualquier momento sin
afectar tus datos reales. La app nunca crea datos de ejemplo por sí sola.

## 10. Resumen técnico de lo construido

- **Frontend/backend:** Next.js 14 App Router. Páginas de servidor para lectura (listado, ficha del
  café), rutas de API para escritura y para el reconocimiento de etiquetas.
- **Base de datos:** Postgres en Supabase (`supabase/schema.sql`), dos tablas: `CAFES` y `PREPARACIONES`. El esquema se crea desde cero, sin migrar datos de tablas anteriores.
  Cada preparación guarda una copia congelada de la receta (dosis, ratio, bloom, vertidos y pesos
  resultantes), así que cambiar la calculadora después no altera preparaciones ya guardadas.
- **Fotos:** comprimidas y opcionalmente recortadas/giradas en el navegador (canvas, sin librerías
  externas), subidas a un bucket privado de Supabase Storage, servidas a través de una ruta propia.
- **OCR:** la imagen se envía desde el servidor a OCR.space (`src/app/api/ocr/route.ts`); la respuesta
  se interpreta con reglas propias (`src/lib/labelParser.ts`, vocabularios de variedades/procesos/
  regiones + patrones de altitud/persona) para proponer los campos. La API key nunca se expone al
  navegador y las propuestas no se guardan como definitivas hasta que se guarda el café.
- **Calculadora de vertidos:** café (g), ratio, bloom configurable (1:2/1:3/1:4) y número de vertidos
  posteriores; reparte el agua restante en partes iguales y muestra pesos acumulados para la báscula.

## 11. Pruebas realizadas y resultados

- `npm run typecheck` (`tsc --noEmit`): sin errores.
- `npm run build`: build de producción completo sin errores (11 rutas generadas correctamente).
- Pruebas funcionales end-to-end contra la API en local (con una base de datos de prueba):
  crear/listar/buscar/eliminar café, crear/editar/eliminar preparación, validaciones de formulario
  (nombre de café obligatorio, dosis > 0, etc.), exportar/importar JSON, agregar y eliminar datos de
  ejemplo, y navegación de todas las páginas (incluida una ruta inexistente → 404) — todo respondió
  con los códigos y datos esperados.
- Prueba de resiliencia: si Supabase no está configurado o no responde, la página principal y la
  ficha de café muestran un aviso explicando qué revisar, en vez de una pantalla de error genérica.
- **Prueba específica de las heurísticas de reconocimiento de etiquetas** (`src/lib/labelParser.ts`):
  ejecuté el motor de extracción de campos con texto equivalente al de los 5 empaques de ejemplo del
  enunciado (Lohas Café ×2, Soare Coffee ×3) y con un empaque genérico inventado. Esto encontró y
  corrigió dos errores reales antes de la entrega:
  1. "Maragesha" se detectaba por error como "Gesha" (coincidencia parcial); ahora las variedades
     compuestas se comparan primero.
  2. Los nombres de tostador con tilde ("Café") no se reconocían por un límite de palabra de
     JavaScript que no funciona bien con letras acentuadas; corregido.
  Tras los ajustes, los 6 casos de prueba extrajeron correctamente variedad, proceso, región,
  altitud, productor y notas de cata, y el empaque genérico no inventó ningún dato para los campos
  que no pudo reconocer.
- La ruta usa OCR.space con `language=spa`, Engine 2 y superposición de texto. La primera prueba con
  una foto real confirma tanto la conectividad como la calidad del reconocimiento en tus etiquetas.
- Tampoco tuve credenciales reales de Supabase en este entorno para probar la conexión real a tu
  proyecto; el código sigue la documentación oficial del cliente `@supabase/supabase-js`.
