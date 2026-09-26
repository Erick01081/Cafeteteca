// Utilidades que corren en el navegador para preparar la foto del empaque
// antes de subirla: la redimensionan y comprimen para que el reconocimiento
// y el guardado sean rápidos, sin depender de librerías externas.

export interface ProcessedImage {
  dataUrl: string;
  width: number;
  height: number;
}

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

export function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen. Intenta con otro archivo o foto.'));
    };
    img.src = url;
  });
}

/**
 * Dibuja la imagen en un canvas, limitando su lado mayor a MAX_DIMENSION,
 * y devuelve un data URL en JPEG comprimido. rotationDeg debe ser múltiplo
 * de 90 (0, 90, 180, 270).
 */
export function drawToCanvas(
  img: HTMLImageElement,
  opts: { rotationDeg?: number; crop?: { x: number; y: number; w: number; h: number } } = {}
): ProcessedImage {
  const rotation = ((opts.rotationDeg || 0) % 360 + 360) % 360;
  const swap = rotation === 90 || rotation === 270;

  const srcX = opts.crop?.x ?? 0;
  const srcY = opts.crop?.y ?? 0;
  const srcW = opts.crop?.w ?? img.naturalWidth;
  const srcH = opts.crop?.h ?? img.naturalHeight;

  const outW = swap ? srcH : srcW;
  const outH = swap ? srcW : srcH;

  const scale = Math.min(1, MAX_DIMENSION / Math.max(outW, outH));
  const targetW = Math.max(1, Math.round(outW * scale));
  const targetH = Math.max(1, Math.round(outH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('El navegador no soporta procesamiento de imágenes (canvas).');

  ctx.save();
  ctx.translate(targetW / 2, targetH / 2);
  ctx.rotate((rotation * Math.PI) / 180);

  const drawW = swap ? targetH : targetW;
  const drawH = swap ? targetW : targetH;
  ctx.drawImage(img, srcX, srcY, srcW, srcH, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  return { dataUrl, width: targetW, height: targetH };
}

export function estimateDataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] || '';
  return Math.round((base64.length * 3) / 4);
}
