import { NextRequest, NextResponse } from 'next/server';
import { createPreparation, getCoffee } from '@/lib/repo';
import { PreparationInput, PreparationPour } from '@/lib/types';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.coffeeId !== 'string' || !body.coffeeId) {
    return NextResponse.json({ error: 'Debes indicar el café de esta receta.' }, { status: 400 });
  }
  if (typeof body.dripper !== 'string' || !body.dripper.trim()) {
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
  if (doseGrams <= 0 || ratio <= 0 || bloomWaterG <= 0 || totalWaterG <= 0 || pourCount < 0) {
    return NextResponse.json({ error: 'Los valores numéricos de la receta son inválidos.' }, { status: 400 });
  }
  if (!['1:2', '1:3', '1:4'].includes(body.bloomRatio)) {
    return NextResponse.json({ error: 'El bloom debe ser 1:2, 1:3 o 1:4.' }, { status: 400 });
  }
  const pours = normalizePours(body.pours);
  if (pours.length === 0) return NextResponse.json({ error: 'Debes incluir al menos el paso de bloom.' }, { status: 400 });

  try {
    const coffee = await getCoffee(body.coffeeId);
    if (!coffee) return NextResponse.json({ error: 'No se encontró el café asociado.' }, { status: 404 });
    const input: PreparationInput = {
      coffeeId: coffee.id,
      brewedAt: toIsoString(body.brewedAt) || new Date().toISOString(),
      dripper: body.dripper.trim(),
      dripperOther: nullableStr(body.dripperOther),
      grindText: body.grindText.trim(),
      waterTempC: nullableNum(body.waterTempC),
      doseGrams, ratio,
      bloomRatio: body.bloomRatio as PreparationInput['bloomRatio'],
      bloomWaterG, pourCount, totalWaterG, pours,
      totalTimeSec: nullableInt(body.totalTimeSec),
      notesFlavor: nullableStr(body.notesFlavor),
      notesAroma: nullableStr(body.notesAroma),
      notesBody: nullableStr(body.notesBody),
      notesExtraction: nullableStr(body.notesExtraction),
      notesChange: nullableStr(body.notesChange),
      notesOther: nullableStr(body.notesOther)
    };
    const preparation = await createPreparation(input);
    return NextResponse.json({ preparation }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'No se pudo guardar la receta.' }, { status: 500 });
  }
}

function num(value: unknown): number {
  const parsed = typeof value === 'string' ? Number.parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function intNum(value: unknown): number {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : Number(value);
  return Number.isInteger(parsed) ? parsed : -1;
}

function nullableNum(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = num(value);
  return parsed > 0 ? parsed : null;
}

function nullableInt(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = intNum(value);
  return parsed >= 0 ? parsed : null;
}

function nullableStr(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function toIsoString(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizePours(value: unknown): PreparationPour[] {
  if (!Array.isArray(value)) return [];
  return value.map((pour: any) => ({
    n: intNum(pour?.n),
    label: typeof pour?.label === 'string' ? pour.label : '',
    stepWaterG: num(pour?.stepWaterG),
    cumulativeWaterG: num(pour?.cumulativeWaterG)
  })).filter((pour) => pour.n >= 0 && pour.label && pour.stepWaterG > 0 && pour.cumulativeWaterG > 0);
}
