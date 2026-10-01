import { NextRequest, NextResponse } from 'next/server';
import { createCoffee, listCoffees } from '@/lib/repo';
import { savePhotoFromDataUrl } from '@/lib/storage';
import { CoffeeInput } from '@/lib/types';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || undefined;
  try {
    const coffees = await listCoffees(q);
    return NextResponse.json({ coffees });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== 'string' || !body.name.trim()) {
    return NextResponse.json({ error: 'El nombre del café es obligatorio.' }, { status: 400 });
  }

  let photoPath: string | null = null;
  let photoWidth: number | null = null;
  let photoHeight: number | null = null;

  if (typeof body.photoDataUrl === 'string' && body.photoDataUrl.startsWith('data:image/')) {
    try {
      const saved = await savePhotoFromDataUrl(body.photoDataUrl);
      photoPath = saved.filename;
      photoWidth = typeof body.photoWidth === 'number' ? body.photoWidth : null;
      photoHeight = typeof body.photoHeight === 'number' ? body.photoHeight : null;
    } catch (err: any) {
      return NextResponse.json({ error: err.message || 'No se pudo guardar la foto.' }, { status: 400 });
    }
  }

  const input: CoffeeInput = {
    name: body.name.trim(),
    roaster: nullableStr(body.roaster),
    country: nullableStr(body.country),
    region: nullableStr(body.region),
    municipality: nullableStr(body.municipality),
    farm: nullableStr(body.farm),
    producer: nullableStr(body.producer),
    variety: nullableStr(body.variety),
    process: nullableStr(body.process),
    altitude: nullableStr(body.altitude),
    tastingNotes: nullableStr(body.tastingNotes),
    photoPath,
    photoWidth,
    photoHeight,
    ocrRawText: nullableStr(body.ocrRawText),
    ocrConfidence: nullableStr(body.ocrConfidence),
    ocrFieldsFound: body.ocrFieldsFound ?? null
  };

  try {
    const coffee = await createCoffee(input);
    return NextResponse.json({ coffee }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function nullableStr(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t : null;
}
