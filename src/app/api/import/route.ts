import { NextRequest, NextResponse } from 'next/server';
import { importAll } from '@/lib/repo';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.coffees)) {
    return NextResponse.json(
      { error: 'El archivo no tiene el formato esperado (falta la lista coffees[]).' },
      { status: 400 }
    );
  }
  try {
    // Las exportaciones antiguas pueden traer brews[]; se ignoran.
    const result = await importAll({ coffees: body.coffees });
    return NextResponse.json({ result });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'No se pudo importar el archivo.' }, { status: 400 });
  }
}
