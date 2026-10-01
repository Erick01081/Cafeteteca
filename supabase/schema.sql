-- Esquema inicial de Cafeteca.
-- Crea dos tablas nuevas y vacías; no copia ni modifica datos de tablas anteriores.

create table if not exists public."CAFES" (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  roaster text,
  country text,
  region text,
  municipality text,
  farm text,
  producer text,
  variety text,
  process text,
  altitude text,
  tasting_notes text,
  photo_path text,
  photo_width integer,
  photo_height integer,
  ocr_raw_text text,
  ocr_confidence text check (ocr_confidence in ('alta', 'media', 'baja')),
  ocr_fields_found jsonb,
  is_sample boolean not null default false
);

create table if not exists public."PREPARACIONES" (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  coffee_id uuid references public."CAFES" (id) on delete set null,
  brewed_at timestamptz not null,
  dripper text not null,
  dripper_other text,
  grind_text text not null,
  water_temp_c numeric,
  dose_grams numeric not null check (dose_grams > 0),
  ratio numeric not null check (ratio > 0),
  bloom_ratio text not null check (bloom_ratio in ('1:2', '1:3', '1:4')),
  bloom_water_g numeric not null check (bloom_water_g > 0),
  pour_count integer not null check (pour_count >= 0),
  total_water_g numeric not null check (total_water_g > 0),
  pours jsonb not null,
  total_time_sec integer,
  notes_flavor text,
  notes_aroma text,
  notes_body text,
  notes_extraction text,
  notes_change text,
  notes_other text,
  is_sample boolean not null default false
);

create index if not exists preparaciones_coffee_id_idx
  on public."PREPARACIONES" (coffee_id);

grant usage on schema public to service_role;
grant all on table public."CAFES", public."PREPARACIONES" to service_role;

-- Actualiza el esquema que PostgREST expone a la API de Supabase.
notify pgrst, 'reload schema';
