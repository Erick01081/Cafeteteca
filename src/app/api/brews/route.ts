import { NextRequest, NextResponse } from 'next/server';
import { createBrew, getCoffee, listBrewsForCoffee, listUnassignedBrews } from '@/lib/repo';
import { buildBrewInput, validateBrewBody } from '@/lib/brewValidation';

export async function GET(req: NextRequest) {
  const coffeeId = req.nextUrl.searchParams.get('coffeeId');
  const brews = coffeeId ? await listBrewsForCoffee(coffeeId) : await listUnassignedBrews();
  return NextResponse.json({ brews });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const error = validateBrewBody(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  if (body.coffeeId && !(await getCoffee(body.coffeeId))) {
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
