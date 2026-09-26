import { NextRequest, NextResponse } from 'next/server';
import { readPhoto } from '@/lib/storage';

export async function GET(_req: NextRequest, { params }: { params: { filename: string } }) {
  const photo = await readPhoto(params.filename);
  if (!photo) return NextResponse.json({ error: 'Imagen no encontrada.' }, { status: 404 });
  return new NextResponse(photo.buffer, {
    headers: {
      'Content-Type': photo.mime,
      'Cache-Control': 'private, max-age=31536000, immutable'
    }
  });
}
