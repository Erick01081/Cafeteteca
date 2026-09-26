import { randomUUID } from 'node:crypto';
import { PHOTOS_BUCKET, getSupabase } from './supabase';

const DATA_URL_RE = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/;
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB de margen tras la compresión en el navegador

/**
 * Sube una imagen recibida como data URL (ya comprimida en el navegador) al
 * bucket privado de Supabase Storage y devuelve el nombre de archivo generado.
 * El bucket es privado: solo se lee a través de la ruta /api/uploads/[filename],
 * que usa la service role key en el servidor para descargarla y reenviarla.
 */
export async function savePhotoFromDataUrl(dataUrl: string): Promise<{ filename: string; bytes: number }> {
  const match = DATA_URL_RE.exec(dataUrl);
  if (!match) {
    throw new Error('Formato de imagen no soportado. Usa JPEG, PNG o WebP.');
  }
  const mime = match[1];
  const base64 = match[2];
  const buffer = Buffer.from(base64, 'base64');

  if (buffer.byteLength > MAX_BYTES) {
    throw new Error('La imagen es demasiado grande incluso tras comprimirla.');
  }

  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const filename = `${randomUUID()}.${ext}`;

  const supabase = getSupabase();
  const { error } = await supabase.storage.from(PHOTOS_BUCKET).upload(filename, buffer, {
    contentType: mime,
    upsert: false
  });
  if (error) {
    throw new Error(`No se pudo subir la foto a Supabase Storage: ${error.message}`);
  }

  return { filename, bytes: buffer.byteLength };
}

export async function deletePhoto(filename: string | null | undefined): Promise<void> {
  if (!filename) return;
  const supabase = getSupabase();
  // No interrumpe la operación principal si falla el borrado del archivo.
  await supabase.storage.from(PHOTOS_BUCKET).remove([filename]).catch(() => null);
}

export async function readPhoto(filename: string): Promise<{ buffer: Buffer; mime: string } | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage.from(PHOTOS_BUCKET).download(filename);
  if (error || !data) return null;

  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mime = data.type || guessMimeFromFilename(filename);
  return { buffer, mime };
}

function guessMimeFromFilename(filename: string): string {
  if (filename.endsWith('.png')) return 'image/png';
  if (filename.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}
