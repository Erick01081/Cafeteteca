import { NextRequest, NextResponse } from 'next/server';
import { deleteCoffee, getCoffee, listBrewsForCoffee, updateCoffee } from '@/lib/repo';
import { deletePhoto, savePhotoFromDataUrl } from '@/lib/storage';
import { CoffeeInput } from '@/lib/types';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const coffee = await getCoffee(params.id);
  if (!coffee) return NextResponse.json({ error: 'Café no encontrado.' }, { status: 404 });
  const brews = await listBrewsForCoffee(params.id);
  return NextResponse.json({ coffee, brews });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const existing = await getCoffee(params.id);
  if (!existing) return NextResponse.json({ error: 'Café no encontrado.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== 'string' || !body.name.trim()) {
    return NextResponse.json({ error: 'El nombre del café es obligatorio.' }, { status: 400 });
  }

  let photoPath: string | null | undefined = undefined;
  let photoWidth: number | null | undefined = undefined;
  let photoHeight: number | null | undefined = undefined;

  if (typeof body.photoDataUrl === 'string' && body.photoDataUrl.startsWith('data:image/')) {
    try {
      const saved = await savePhotoFromDataUrl(body.photoDataUrl);
      await deletePhoto(existing.photoPath);
      photoPath = saved.filename;
      photoWidth = typeof body.photoWidth === 'number' ? body.photoWidth : null;
      photoHeight = typeof body.photoHeight === 'number' ? body.photoHeight : null;
    } catch (err: any) {
      return NextResponse.json({ error: err.message || 'No se pudo guardar la foto.' }, { status: 400 });
    }
  } else if (body.photoDataUrl === null) {
    // La persona quitó la foto explícitamente.
    await deletePhoto(existing.photoPath);
    photoPath = null;
    photoWidth = null;
    photoHeight = null;
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
    photoHeight
  };

  try {
    const coffee = await updateCoffee(params.id, input);
    return NextResponse.json({ coffee });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const existing = await getCoffee(params.id);
  if (!existing) return NextResponse.json({ error: 'Café no encontrado.' }, { status: 404 });
  await deleteCoffee(params.id); // ON DELETE CASCADE elimina también sus preparaciones
  await deletePhoto(existing.photoPath);
  return NextResponse.json({ ok: true });
}

function nullableStr(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t : null;
}
