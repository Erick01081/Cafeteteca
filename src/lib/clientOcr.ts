import { ParsedLabel } from './labelParser';

export interface OcrProgress {
  status: string;
  progress: number;
}

/** Envía la imagen al endpoint propio; la API key solo existe en el servidor. */
export async function recognizeLabelWithApi(
  imageDataUrl: string,
  onProgress?: (progress: OcrProgress) => void
): Promise<ParsedLabel> {
  onProgress?.({ status: 'uploading', progress: 0.1 });
  const response = await fetch('/api/ocr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageDataUrl })
  });

  onProgress?.({ status: 'processing', progress: 0.6 });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.parsed) {
    throw new Error(result?.error || 'No se pudo leer la etiqueta.');
  }

  onProgress?.({ status: 'done', progress: 1 });
  return result.parsed as ParsedLabel;
}
