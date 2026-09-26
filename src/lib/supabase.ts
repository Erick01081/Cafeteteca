import { createClient, SupabaseClient } from '@supabase/supabase-js';

// IMPORTANTE: este módulo usa la "service role key" de Supabase, que tiene
// acceso total a la base de datos y al storage sin pasar por Row Level
// Security. NUNCA debe importarse desde un componente de cliente ('use client')
// ni exponerse al navegador: solo se usa dentro de rutas de API y componentes
// de servidor de Next.js, que corren en el backend.

const globalForSupabase = globalThis as unknown as { __cafetecaSupabase?: SupabaseClient };

function createServerClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new MissingSupabaseConfigError(
      'Falta configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el archivo .env. ' +
        'Revisa el README para crear tu proyecto gratuito en Supabase y obtener estas credenciales.'
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Evita que el Data Cache de Next.js sirva listados viejos después de crear
    // o editar registros en Supabase.
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' })
    }
  });
}

export class MissingSupabaseConfigError extends Error {}

export function getSupabase(): SupabaseClient {
  if (!globalForSupabase.__cafetecaSupabase) {
    globalForSupabase.__cafetecaSupabase = createServerClient();
  }
  return globalForSupabase.__cafetecaSupabase;
}

export const PHOTOS_BUCKET = process.env.SUPABASE_PHOTOS_BUCKET || 'cafeteca-fotos';
