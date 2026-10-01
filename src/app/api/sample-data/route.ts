import { NextResponse } from 'next/server';
import { createCoffee, deleteSampleData, listCoffees } from '@/lib/repo';

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
    const existing = (await listCoffees()).filter((c) => c.isSample);
    if (existing.length > 0) return NextResponse.json({ ok: true, alreadyExisted: true });

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
    return NextResponse.json({ ok: true, coffeeId: coffee.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
