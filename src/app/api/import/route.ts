import { NextRequest, NextResponse } from 'next/server';
import { importAll } from '@/lib/repo';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.coffees) || !Array.isArray(body.brews)) {
    return NextResponse.json(
      { error: 'El archivo no tiene el formato esperado (coffees[] y brews[]).' },
      { status: 400 }
    );
  }
  try {
    const result = await importAll(body);
    return NextResponse.json({ result });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'No se pudo importar el archivo.' }, { status: 400 });
  }
}
