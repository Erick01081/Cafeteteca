import { NextRequest, NextResponse } from 'next/server';
import { deleteBrew, getBrew, updateBrew } from '@/lib/repo';
import { buildBrewInput, validateBrewBody } from '@/lib/brewValidation';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const brew = await getBrew(params.id);
  if (!brew) return NextResponse.json({ error: 'Preparación no encontrada.' }, { status: 404 });
  return NextResponse.json({ brew });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const existing = await getBrew(params.id);
  if (!existing) return NextResponse.json({ error: 'Preparación no encontrada.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const bodyWithCoffee = { ...body, coffeeId: body?.coffeeId || existing.coffeeId };
  const error = validateBrewBody(bodyWithCoffee);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const input = buildBrewInput(bodyWithCoffee);
    const brew = await updateBrew(params.id, input);
    return NextResponse.json({ brew });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const existing = await getBrew(params.id);
  if (!existing) return NextResponse.json({ error: 'Preparación no encontrada.' }, { status: 404 });
  await deleteBrew(params.id);
  return NextResponse.json({ ok: true });
}
