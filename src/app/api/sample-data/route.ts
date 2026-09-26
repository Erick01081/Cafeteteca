import { NextResponse } from 'next/server';
import { createCoffee, createBrew, deleteSampleData, listCoffees } from '@/lib/repo';
import { calculateRecipe } from '@/lib/calculator';

export async function DELETE() {
  try {
    const result = await deleteSampleData();
    return NextResponse.json({ result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Evita duplicar si ya existen datos de ejemplo.
    const existingSamples = (await listCoffees()).filter((c) => c.isSample);
    if (existingSamples.length > 0) {
      return NextResponse.json({ ok: true, alreadyExisted: true });
    }

    const coffee = await createCoffee(
      {
        name: 'Café de ejemplo — Finca El Triunfo',
        roaster: 'Tostador de ejemplo',
        country: 'Colombia',
        region: 'Huila',
        municipality: 'Pitalito',
        farm: 'El Triunfo',
        producer: 'Productor de ejemplo',
        variety: 'Sudan Rume',
        process: 'Anaeróbico natural',
        altitude: '1800 msnm',
        tastingNotes: 'Frutos rojos, panela, floral'
      },
      true
    );

    const recipe = calculateRecipe({ doseGrams: 15, ratio: 16, bloomRatio: '1:3', pourCount: 3 });
    await createBrew(
      {
        coffeeId: coffee.id,
        brewedAt: new Date().toISOString(),
        dripper: 'V60',
        grindText: 'Comandante, 24 clicks (media-fina) — dato de ejemplo',
        waterTempC: 93,
        doseGrams: recipe.doseGrams,
        ratio: recipe.ratio,
        bloomRatio: recipe.bloomRatio,
        bloomWaterG: recipe.bloomWaterG,
        pourCount: recipe.pourCount,
        totalWaterG: recipe.totalWaterG,
        pours: recipe.pours,
        totalTimeSec: 165,
        notesFlavor: 'Frutos rojos, panela — dato de ejemplo',
        notesAroma: 'Floral, dato de ejemplo',
        notesBody: 'Medio, dato de ejemplo',
        notesExtraction: 'Equilibrada, dato de ejemplo',
        notesChange: 'Moler un poco más grueso — dato de ejemplo'
      },
      true
    );

    return NextResponse.json({ ok: true, coffeeId: coffee.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
