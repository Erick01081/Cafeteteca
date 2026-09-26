import { NextRequest, NextResponse } from 'next/server';
import { createBrew, getCoffee, listBrewsForCoffee } from '@/lib/repo';
import { buildBrewInput, validateBrewBody } from '@/lib/brewValidation';

export async function GET(req: NextRequest) {
  const coffeeId = req.nextUrl.searchParams.get('coffeeId');
  if (!coffeeId) return NextResponse.json({ error: 'Falta coffeeId.' }, { status: 400 });
  const brews = await listBrewsForCoffee(coffeeId);
  return NextResponse.json({ brews });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const error = validateBrewBody(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  if (!(await getCoffee(body.coffeeId))) {
    return NextResponse.json({ error: 'El café asociado no existe.' }, { status: 404 });
  }

  try {
    const input = buildBrewInput(body);
    const brew = await createBrew(input);
    return NextResponse.json({ brew }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
