import { OcrFieldsFound } from './types';

export interface OcrLine {
  text: string;
  height: number; // alto aproximado del texto (para detectar "letras grandes")
  y: number; // posición vertical (para saber qué va arriba/abajo)
  confidence: number; // 0-100, confianza reportada por el motor de OCR
}

export interface ParsedLabel {
  fields: {
    name: string | null;
    roaster: string | null;
    variety: string | null;
    country: string | null;
    region: string | null;
    municipality: string | null;
    farm: string | null;
    producer: string | null;
    process: string | null;
    altitude: string | null;
    tastingNotes: string | null;
  };
  fieldsFound: OcrFieldsFound;
  confidence: 'alta' | 'media' | 'baja';
  rawText: string;
}

// ---------- Vocabularios conocidos ----------
// No es una lista cerrada: sirve para RECONOCER datos típicos de fichas de café,
// pero cualquier palabra o número que no encaje en estas listas simplemente se
// deja sin clasificar (nunca se inventa nada).

const VARIETIES = [
  'pacamara', 'red bourbon', 'bourbon rojo', 'bourbon amarillo', 'yellow bourbon', 'bourbon',
  'caturra', 'castillo', 'typica', 'tipica', 'geisha', 'gesha', 'maragesha', 'maragogipe',
  'sudan rume', 'rume sudan', 'pink bourbon', 'bourbon rosado', 'tabi', 'java', 'catuai', 'catuaí',
  'mundo novo', 'sl28', 'sl-28', 'sl34', 'sl-34', 'villa sarchi', 'villasarchi', 'obata', 'catucai',
  'caturron', 'wush wush', 'sidra', 'chiroso', 'papayo', 'moka', 'mokka', 'ethiopian heirloom',
  'heirloom etíope', 'jember', 'batian'
];

const PROCESSES: [RegExp, string][] = [
  [/anaer[oó]bic[oa]\s*natural|natural\s*anaer[oó]bic[oa]/i, 'Anaeróbico natural'],
  [/anaer[oó]bic[oa]\s*lavad[oa]|lavad[oa]\s*anaer[oó]bic[oa]/i, 'Anaeróbico lavado'],
  [/anaerobic\s*natural|natural\s*anaerobic/i, 'Anaeróbico natural'],
  [/anaer[oó]bic[oa]|anaerobic/i, 'Anaeróbico'],
  [/doble\s*fermentaci[oó]n|double\s*ferment/i, 'Doble fermentación'],
  [/honey|miel/i, 'Honey'],
  [/lavad[oa]\s*\/?\s*washed|washed\s*\/?\s*lavad[oa]/i, 'Lavado'],
  [/\blavad[oa]\b/i, 'Lavado'],
  [/\bwashed\b/i, 'Washed'],
  [/\bnatural\b/i, 'Natural'],
  [/despulpad[oa]\s*natural|pulped\s*natural/i, 'Despulpado natural']
];

const COUNTRIES: Record<string, string> = {
  colombia: 'Colombia', 'méxico': 'México', mexico: 'México', guatemala: 'Guatemala',
  honduras: 'Honduras', 'el salvador': 'El Salvador', 'costa rica': 'Costa Rica',
  'panamá': 'Panamá', panama: 'Panamá', nicaragua: 'Nicaragua', 'perú': 'Perú', peru: 'Perú',
  ecuador: 'Ecuador', brasil: 'Brasil', brazil: 'Brasil', 'etiopía': 'Etiopía', etiopia: 'Etiopía',
  ethiopia: 'Etiopía', kenia: 'Kenia', kenya: 'Kenia', rwanda: 'Ruanda', ruanda: 'Ruanda',
  burundi: 'Burundi', yemen: 'Yemen', indonesia: 'Indonesia', 'república dominicana': 'República Dominicana',
  bolivia: 'Bolivia', venezuela: 'Venezuela', tanzania: 'Tanzania', uganda: 'Uganda'
};

// Departamentos/regiones cafeteras más comunes (Colombia y vecinos). No es exhaustivo.
const REGIONS: Record<string, string> = {
  huila: 'Huila', 'nariño': 'Nariño', narino: 'Nariño', cauca: 'Cauca', tolima: 'Tolima',
  risaralda: 'Risaralda', caldas: 'Caldas', 'quindío': 'Quindío', quindio: 'Quindío',
  antioquia: 'Antioquia', 'valle del cauca': 'Valle del Cauca', santander: 'Santander',
  'norte de santander': 'Norte de Santander', 'boyacá': 'Boyacá', boyaca: 'Boyacá', cesar: 'Cesar',
  magdalena: 'Magdalena', meta: 'Meta', cundinamarca: 'Cundinamarca'
};

const FLAVOR_WORDS = [
  'limoncillo', 'toronja', 'cardamomo', 'canela', 'anís', 'anis', 'cereza', 'frambuesa', 'cacao',
  'chocolate', 'banana', 'panela', 'floral', 'afrutado', 'frutos rojos', 'mora', 'fresa', 'durazno',
  'maracuyá', 'maracuya', 'jazmín', 'jazmin', 'miel', 'caramelo', 'nuez', 'almendra', 'vainilla',
  'melocotón', 'melocoton', 'ciruela', 'uva', 'licor', 'especias', 'cítrico', 'citrico', 'naranja',
  'mandarina', 'piña', 'pina', 'mango', 'manzana', 'papaya', 'coco', 'té negro', 'te negro',
  'panela', 'azúcar morena', 'jengibre'
];

const PRODUCER_KEYWORDS = /productor(?:a)?\s*[:\-]?\s*(.+)/i;
const FARM_KEYWORDS = /(?:finca|hacienda|lote)\s*[:\-]?\s*(.+)/i;
const MUNICIPALITY_HINT = /\b(municipio|vereda)\s*[:\-]?\s*(.+)/i;
const ALTITUDE_RE = /(\d{3,4}(?:\s*[-–a]\s*\d{3,4})?)\s*(?:m\.?\s?s\.?\s?n\.?\s?m\.?|masl|m\.?a\.?s\.?l\.?)/i;
const ROASTER_HINT = /\bcaf[eé](?![a-záéíóúñ])|\bcoffee\b|\btostador(?:a)?\b|\broasters?\b/i;
// Dos a cuatro palabras con mayúscula inicial y sin conectores en minúscula:
// patrón típico de un nombre de persona impreso sin ninguna etiqueta ("Productor:", etc.).
const PERSON_NAME_RE =
  /^[A-ZÁÉÍÓÚÑ][a-zá-úñ]+(?:\s[A-ZÁÉÍÓÚÑ][a-zá-úñ]+){1,3}$/;

// Las variedades compuestas (p. ej. "Maragesha") deben revisarse antes que las
// que quedan contenidas dentro de ellas (p. ej. "Gesha"), o si no "Maragesha"
// se detectaría por error como "Gesha".
const VARIETIES_BY_LENGTH = [...VARIETIES].sort((a, b) => b.length - a.length);

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalize(s: string): string {
  return stripAccents(s.toLowerCase()).trim();
}

export function parseLabel(lines: OcrLine[]): ParsedLabel {
  const rawText = lines.map((l) => l.text).join('\n');
  const used = new Set<number>(); // índices de líneas ya asignadas a un campo

  const fields = {
    name: null as string | null,
    roaster: null as string | null,
    variety: null as string | null,
    country: null as string | null,
    region: null as string | null,
    municipality: null as string | null,
    farm: null as string | null,
    producer: null as string | null,
    process: null as string | null,
    altitude: null as string | null,
    tastingNotes: null as string | null
  };

  // 1) Coincidencias por vocabulario/patrón: son las más confiables porque no
  //    dependen de que haya un título ("variedad:", "proceso:", etc.).
  lines.forEach((line, i) => {
    const norm = normalize(line.text);
    if (used.has(i) || !norm) return;

    if (!fields.variety) {
      const match = VARIETIES_BY_LENGTH.find((v) => norm.includes(v));
      if (match) {
        fields.variety = titleCaseMatch(line.text, match);
        used.add(i);
        return;
      }
    }
    if (!fields.process) {
      for (const [re, label] of PROCESSES) {
        if (re.test(line.text)) {
          fields.process = label;
          used.add(i);
          return;
        }
      }
    }
    if (!fields.country) {
      const key = Object.keys(COUNTRIES).find((c) => norm.includes(c));
      if (key) {
        fields.country = COUNTRIES[key];
        used.add(i);
        return;
      }
    }
    if (!fields.region) {
      const key = Object.keys(REGIONS).find((r) => norm.includes(r));
      if (key) {
        fields.region = REGIONS[key];
        used.add(i);
        return;
      }
    }
    if (!fields.altitude) {
      const m = ALTITUDE_RE.exec(line.text);
      if (m) {
        fields.altitude = `${m[1]} msnm`;
        used.add(i);
        return;
      }
    }
    if (!fields.producer) {
      const m = PRODUCER_KEYWORDS.exec(line.text);
      if (m && m[1].trim()) {
        fields.producer = cleanValue(m[1]);
        used.add(i);
        return;
      }
    }
    if (!fields.farm) {
      const m = FARM_KEYWORDS.exec(line.text);
      if (m && m[1].trim()) {
        fields.farm = cleanValue(m[1]);
        used.add(i);
        return;
      }
    }
    if (!fields.municipality) {
      const m = MUNICIPALITY_HINT.exec(line.text);
      if (m && m[2]?.trim()) {
        fields.municipality = cleanValue(m[2]);
        used.add(i);
        return;
      }
    }
  });

  // 2) Notas de cata: una línea con 2+ palabras del léxico de sabores
  //    (con o sin la palabra "notas"/"perfil" delante).
  lines.forEach((line, i) => {
    if (used.has(i) || fields.tastingNotes) return;
    const norm = normalize(line.text);
    const hits = FLAVOR_WORDS.filter((w) => norm.includes(stripAccents(w)));
    if (hits.length >= 2) {
      fields.tastingNotes = cleanValue(line.text.replace(/^(notas?( de cata)?|perfil|tasting notes?)\s*[:\-]?/i, ''));
      used.add(i);
    }
  });

  // 3) Marca/tostador: línea que contenga "café"/"coffee"/"tostador", suele
  //    estar cerca del inicio de la etiqueta.
  if (!fields.roaster) {
    const candidates = lines
      .map((l, i) => ({ l, i }))
      .filter(({ l, i }) => !used.has(i) && ROASTER_HINT.test(l.text) && l.text.trim().length <= 40);
    if (candidates.length > 0) {
      candidates.sort((a, b) => a.l.y - b.l.y); // el más alto en la imagen primero
      fields.roaster = cleanValue(candidates[0].l.text);
      used.add(candidates[0].i);
    }
  }

  // 4) Productor sin etiqueta: muchas etiquetas imprimen el nombre de la
  //    persona productora sin la palabra "Productor:" delante. Si una línea
  //    aún libre luce como un nombre propio (2-4 palabras con mayúscula
  //    inicial), es más probable que sea el productor que el nombre del café.
  if (!fields.producer) {
    const candidate = lines.find((l, i) => !used.has(i) && PERSON_NAME_RE.test(l.text.trim()));
    if (candidate) {
      fields.producer = cleanValue(candidate.text);
      used.add(lines.indexOf(candidate));
    }
  }

  // 5) Nombre del café / microlote: entre las líneas aún sin usar, la de
  //    letra más grande (así se reconocen datos "sin título" impresos en
  //    tipografía grande, como pide la especificación). Se ignoran líneas muy
  //    cortas (probablemente logos/símbolos sueltos) o solo numéricas.
  if (!fields.name) {
    const candidates = lines
      .map((l, i) => ({ l, i }))
      .filter(({ l, i }) => !used.has(i) && l.text.trim().length >= 4 && !/^\d+$/.test(l.text.trim()));
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.l.height - a.l.height);
      fields.name = cleanValue(candidates[0].l.text);
      used.add(candidates[0].i);
    }
  }

  const fieldsFound: OcrFieldsFound = Object.fromEntries(
    Object.entries(fields).map(([k, v]) => [k, v !== null])
  ) as unknown as OcrFieldsFound;

  const avgConfidence =
    lines.length > 0 ? lines.reduce((sum, l) => sum + l.confidence, 0) / lines.length : 0;
  const confidence: ParsedLabel['confidence'] =
    avgConfidence >= 75 ? 'alta' : avgConfidence >= 45 ? 'media' : 'baja';

  return { fields, fieldsFound, confidence, rawText };
}

function cleanValue(s: string): string {
  return s.replace(/\s+/g, ' ').trim().replace(/^[:\-–]+|[:\-–]+$/g, '').trim();
}

function titleCaseMatch(original: string, matchedLower: string): string {
  // Busca el fragmento real (con su capitalización original) dentro del texto fuente.
  const idx = normalize(original).indexOf(matchedLower);
  if (idx === -1) return matchedLower.replace(/\b\w/g, (c) => c.toUpperCase());
  return original.slice(idx, idx + matchedLower.length).trim();
}
