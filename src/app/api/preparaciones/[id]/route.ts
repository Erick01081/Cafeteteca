import { NextRequest, NextResponse } from 'next/server';
import { deletePreparation, getPreparation, updatePreparation } from '@/lib/repo';
import { PreparationInput, PreparationPour } from '@/lib/types';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const existing = await getPreparation(params.id);
  if (!existing) return NextResponse.json({ error: 'Receta no encontrada.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.dripper !== 'string' || !body.dripper.trim()) {
    return NextResponse.json({ error: 'El método es obligatorio.' }, { status: 400 });
  }
  if (typeof body.grindText !== 'string' || !body.grindText.trim()) {
    return NextResponse.json({ error: 'La molienda es obligatoria.' }, { status: 400 });
  }

  const doseGrams = num(body.doseGrams);
  const ratio = num(body.ratio);
  const bloomWaterG = num(body.bloomWaterG);
  const totalWaterG = num(body.totalWaterG);
  const pourCount = intNum(body.pourCount);
  const brewedAt = toIsoString(body.brewedAt) || existing.brewedAt;

  if (doseGrams <= 0 || ratio <= 0 || bloomWaterG <= 0 || totalWaterG <= 0 || pourCount < 0) {
    return NextResponse.json({ error: 'Los valores numéricos de la receta son inválidos.' }, { status: 400 });
  }

  if (!['1:2', '1:3', '1:4'].includes(body.bloomRatio)) {
    return NextResponse.json({ error: 'El bloom debe ser 1:2, 1:3 o 1:4.' }, { status: 400 });
  }

  const pours = normalizePours(body.pours);
  if (pours.length === 0) {
    return NextResponse.json({ error: 'Debes incluir al menos el paso de bloom.' }, { status: 400 });
  }

  const input: PreparationInput = {
    coffeeId: body.coffeeId === null ? null : existing.coffeeId,
    brewedAt,
    dripper: body.dripper.trim(),
    dripperOther: nullableStr(body.dripperOther),
    grindText: body.grindText.trim(),
    waterTempC: nullableNum(body.waterTempC),
    doseGrams,
    ratio,
    bloomRatio: body.bloomRatio as PreparationInput['bloomRatio'],
    bloomWaterG,
    pourCount,
    totalWaterG,
    pours,
    totalTimeSec: nullableInt(body.totalTimeSec),
    notesFlavor: nullableStr(body.notesFlavor),
    notesAroma: nullableStr(body.notesAroma),
    notesBody: nullableStr(body.notesBody),
    notesExtraction: nullableStr(body.notesExtraction),
    notesChange: nullableStr(body.notesChange),
    notesOther: nullableStr(body.notesOther)
  };

  try {
    const preparation = await updatePreparation(params.id, input);
    return NextResponse.json({ preparation });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const existing = await getPreparation(params.id);
  if (!existing) return NextResponse.json({ error: 'Receta no encontrada.' }, { status: 404 });
  await deletePreparation(params.id);
  return NextResponse.json({ ok: true });
}

function num(v: unknown): number {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function intNum(v: unknown): number {
  const n = typeof v === 'string' ? parseInt(v, 10) : Number(v);
  return Number.isInteger(n) ? n : -1;
}

function nullableNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = num(v);
  return Number.isFinite(n) ? n : null;
}

function nullableInt(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = intNum(v);
  return n >= 0 ? n : null;
}

function nullableStr(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t : null;
}

function toIsoString(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function normalizePours(value: unknown): PreparationPour[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((p: any) => ({
      n: intNum(p?.n),
      label: typeof p?.label === 'string' ? p.label : '',
      stepWaterG: num(p?.stepWaterG),
      cumulativeWaterG: num(p?.cumulativeWaterG)
    }))
    .filter((p) => p.n >= 0 && p.label && p.stepWaterG > 0 && p.cumulativeWaterG > 0);
}
