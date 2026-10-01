import { getSupabase } from './supabase';
import { Coffee, CoffeeInput } from './types';

// Supabase/Postgres usa snake_case; la app usa camelCase. Estas funciones
// traducen en ambos sentidos para que el resto del código nunca vea snake_case.

function coffeeFromRow(row: any): Coffee {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    name: row.name,
    roaster: row.roaster,
    country: row.country,
    region: row.region,
    municipality: row.municipality,
    farm: row.farm,
    producer: row.producer,
    variety: row.variety,
    process: row.process,
    altitude: row.altitude,
    tastingNotes: row.tasting_notes,
    photoPath: row.photo_path,
    photoWidth: row.photo_width,
    photoHeight: row.photo_height,
    ocrRawText: row.ocr_raw_text,
    ocrConfidence: row.ocr_confidence,
    ocrFieldsFound: row.ocr_fields_found ?? null,
    isSample: !!row.is_sample
  };
}

function coffeeInputToRow(input: CoffeeInput): Record<string, any> {
  return {
    name: input.name,
    roaster: input.roaster ?? null,
    country: input.country ?? null,
    region: input.region ?? null,
    municipality: input.municipality ?? null,
    farm: input.farm ?? null,
    producer: input.producer ?? null,
    variety: input.variety ?? null,
    process: input.process ?? null,
    altitude: input.altitude ?? null,
    tasting_notes: input.tastingNotes ?? null,
    ...(input.photoPath !== undefined ? { photo_path: input.photoPath } : {}),
    ...(input.photoWidth !== undefined ? { photo_width: input.photoWidth } : {}),
    ...(input.photoHeight !== undefined ? { photo_height: input.photoHeight } : {}),
    ...(input.ocrRawText !== undefined ? { ocr_raw_text: input.ocrRawText } : {}),
    ...(input.ocrConfidence !== undefined ? { ocr_confidence: input.ocrConfidence } : {}),
    ...(input.ocrFieldsFound !== undefined ? { ocr_fields_found: input.ocrFieldsFound } : {})
  };
}

function fail(action: string, error: { message: string } | null): never {
  throw new Error(`${action}: ${error?.message || 'error desconocido de la base de datos.'}`);
}

// ---------- Cafés ----------

export async function listCoffees(search?: string): Promise<Coffee[]> {
  const supabase = getSupabase();
  let query = supabase.from('CAFES').select('*').order('created_at', { ascending: false });

  if (search && search.trim()) {
    const q = escapeForOr(search.trim());
    const orFilter = ['name', 'roaster', 'variety', 'country', 'region', 'municipality', 'farm', 'producer']
      .map((col) => `${col}.ilike.%${q}%`)
      .join(',');
    query = query.or(orFilter);
  }

  const { data, error } = await query;
  if (error) fail('No se pudieron cargar los cafés', error);
  return (data || []).map(coffeeFromRow);
}

function escapeForOr(value: string): string {
  // PostgREST usa "," y ")" como separadores en el filtro .or().
  return value.replace(/[,()]/g, ' ');
}

export async function getCoffee(id: string): Promise<Coffee | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('CAFES').select('*').eq('id', id).maybeSingle();
  if (error) fail('No se pudo cargar el café', error);
  return data ? coffeeFromRow(data) : null;
}

export async function createCoffee(input: CoffeeInput, isSample = false): Promise<Coffee> {
  const supabase = getSupabase();
  const row = { ...coffeeInputToRow(input), is_sample: isSample };
  const { data, error } = await supabase.from('CAFES').insert(row).select('*').single();
  if (error) fail('No se pudo guardar el café', error);
  return coffeeFromRow(data);
}

export async function updateCoffee(id: string, input: CoffeeInput): Promise<Coffee | null> {
  const supabase = getSupabase();
  const row = { ...coffeeInputToRow(input), updated_at: new Date().toISOString() };
  const { data, error } = await supabase.from('CAFES').update(row).eq('id', id).select('*').maybeSingle();
  if (error) fail('No se pudo actualizar el café', error);
  return data ? coffeeFromRow(data) : null;
}

export async function deleteCoffee(id: string): Promise<boolean> {
  const supabase = getSupabase();
  const { error, count } = await supabase.from('CAFES').delete({ count: 'exact' }).eq('id', id);
  if (error) fail('No se pudo eliminar el café', error);
  return (count || 0) > 0;
}

export async function deleteSampleData(): Promise<{ coffees: number }> {
  const supabase = getSupabase();
  const { error, count } = await supabase.from('CAFES').delete({ count: 'exact' }).eq('is_sample', true);
  if (error) fail('No se pudieron eliminar los cafés de ejemplo', error);
  return { coffees: count || 0 };
}

// ---------- Exportación / importación ----------
// Exporta/importa los METADATOS de los cafés. Las fotos viven en Supabase
// Storage por separado y no se incluyen en este JSON.

export async function exportAll() {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('CAFES').select('*');
  if (error) fail('No se pudieron exportar los cafés', error);
  return {
    exportedAt: new Date().toISOString(),
    version: 3,
    coffees: (data || []).map(coffeeFromRow)
  };
}

export async function importAll(data: { coffees: Coffee[] }): Promise<{ coffees: number }> {
  const supabase = getSupabase();

  const coffeeRows = (data.coffees || []).map((c) => ({
    id: c.id,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
    name: c.name,
    roaster: c.roaster ?? null,
    country: c.country ?? null,
    region: c.region ?? null,
    municipality: c.municipality ?? null,
    farm: c.farm ?? null,
    producer: c.producer ?? null,
    variety: c.variety ?? null,
    process: c.process ?? null,
    altitude: c.altitude ?? null,
    tasting_notes: c.tastingNotes ?? null,
    photo_path: c.photoPath ?? null,
    photo_width: c.photoWidth ?? null,
    photo_height: c.photoHeight ?? null,
    ocr_raw_text: c.ocrRawText ?? null,
    ocr_confidence: c.ocrConfidence ?? null,
    ocr_fields_found: c.ocrFieldsFound ?? null,
    is_sample: !!c.isSample
  }));

  if (coffeeRows.length > 0) {
    const { error } = await supabase.from('CAFES').upsert(coffeeRows, { onConflict: 'id' });
    if (error) fail('No se pudieron importar los cafés', error);
  }
  return { coffees: coffeeRows.length };
}
