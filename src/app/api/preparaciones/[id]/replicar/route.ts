import { NextRequest, NextResponse } from 'next/server';
import { createPreparation, getPreparation } from '@/lib/repo';
import { PreparationInput } from '@/lib/types';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const source = await getPreparation(params.id);
  if (!source) return NextResponse.json({ error: 'Receta no encontrada.' }, { status: 404 });

  const input: PreparationInput = {
    coffeeId: source.coffeeId,
    brewedAt: new Date().toISOString(),
    dripper: source.dripper,
    dripperOther: source.dripperOther,
    grindText: source.grindText,
    waterTempC: source.waterTempC,
    doseGrams: source.doseGrams,
    ratio: source.ratio,
    bloomRatio: source.bloomRatio,
    bloomWaterG: source.bloomWaterG,
    pourCount: source.pourCount,
    totalWaterG: source.totalWaterG,
    pours: source.pours,
    totalTimeSec: source.totalTimeSec,
    notesFlavor: source.notesFlavor,
    notesAroma: source.notesAroma,
    notesBody: source.notesBody,
    notesExtraction: source.notesExtraction,
    notesChange: source.notesChange,
    notesOther: source.notesOther
  };

  try {
    const preparation = await createPreparation(input, source.isSample);
    return NextResponse.json({ preparation }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
