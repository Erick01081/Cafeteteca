import { BrewInput, DRIPPERS } from './types';

export function validateBrewBody(body: any): string | null {
  if (!body) return 'Datos inválidos.';
  if (body.coffeeId != null && typeof body.coffeeId !== 'string') return 'Café asociado inválido.';
  if (!body.brewedAt) return 'Falta la fecha de la preparación.';
  if (!DRIPPERS.includes(body.dripper)) return 'Dripper inválido.';
  if (body.dripper === 'Otro' && !body.dripperOther?.trim()) return 'Especifica el dripper en "Otro".';
  if (!body.grindText?.trim()) return 'Describe la molienda.';
  if (typeof body.doseGrams !== 'number' || body.doseGrams <= 0)
    return 'La dosis de café debe ser mayor a 0.';
  if (typeof body.ratio !== 'number' || body.ratio <= 0) return 'El ratio debe ser mayor a 0.';
  if (!['1:2', '1:3', '1:4'].includes(body.bloomRatio)) return 'Bloom inválido.';
  if (!Array.isArray(body.pours) || body.pours.length < 1) return 'Faltan los datos de los vertidos.';
  if (typeof body.totalWaterG !== 'number' || body.totalWaterG <= 0) return 'Agua total inválida.';
  return null;
}

export function buildBrewInput(body: any): BrewInput {
  return {
    coffeeId: body.coffeeId ?? null,
    brewedAt: body.brewedAt,
    dripper: body.dripper,
    dripperOther: body.dripper === 'Otro' ? String(body.dripperOther).trim() : null,
    grindText: String(body.grindText).trim(),
    waterTempC: typeof body.waterTempC === 'number' ? body.waterTempC : null,
    doseGrams: body.doseGrams,
    ratio: body.ratio,
    bloomRatio: body.bloomRatio,
    bloomWaterG: body.bloomWaterG,
    pourCount: body.pourCount,
    totalWaterG: body.totalWaterG,
    pours: body.pours,
    totalTimeSec: typeof body.totalTimeSec === 'number' ? body.totalTimeSec : null,
    notesFlavor: nullableStr(body.notesFlavor),
    notesAroma: nullableStr(body.notesAroma),
    notesBody: nullableStr(body.notesBody),
    notesExtraction: nullableStr(body.notesExtraction),
    notesChange: nullableStr(body.notesChange),
    notesOther: nullableStr(body.notesOther)
  };
}

function nullableStr(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t : null;
}
