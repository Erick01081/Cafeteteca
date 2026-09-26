import { NextRequest, NextResponse } from 'next/server';
import { OcrLine, parseLabel } from '@/lib/labelParser';

const OCR_SPACE_ENDPOINT = 'https://api.ocr.space/parse/image';
const MAX_IMAGE_BYTES = 1_000_000;

interface OcrSpaceWord {
  WordText?: string;
  Top?: number;
  Height?: number;
}

interface OcrSpaceLine {
  Words?: OcrSpaceWord[];
  MinTop?: number;
  MaxHeight?: number;
}

interface OcrSpaceResult {
  ParsedText?: string | null;
  TextOverlay?: { Lines?: OcrSpaceLine[] } | null;
  FileParseExitCode?: number;
  ErrorMessage?: string | string[] | null;
  ErrorDetails?: string | string[] | null;
}

interface OcrSpaceResponse {
  ParsedResults?: OcrSpaceResult[] | null;
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string | string[] | null;
  ErrorDetails?: string | string[] | null;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Falta configurar OCR_SPACE_API_KEY en el servidor.' }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const imageDataUrl = body?.imageDataUrl;
  if (
    typeof imageDataUrl !== 'string' ||
    !/^data:image\/(?:jpeg|png);base64,[A-Za-z0-9+/]+=*$/.test(imageDataUrl)
  ) {
    return NextResponse.json({ error: 'La imagen debe ser JPG o PNG en formato base64.' }, { status: 400 });
  }

  const base64 = imageDataUrl.slice(imageDataUrl.indexOf(',') + 1);
  const imageBytes = Math.floor((base64.length * 3) / 4);
  if (imageBytes > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: 'La foto supera el límite de 1 MB del servicio OCR. Recórtala o comprímela e intenta de nuevo.' },
      { status: 413 }
    );
  }

  const form = new FormData();
  form.set('base64Image', imageDataUrl);
  form.set('language', 'spa');
  form.set('isOverlayRequired', 'true');
  form.set('detectOrientation', 'true');
  form.set('scale', 'true');
  form.set('OCREngine', '2');

  try {
    const response = await fetch(OCR_SPACE_ENDPOINT, {
      method: 'POST',
      headers: { apikey: apiKey },
      body: form,
      signal: AbortSignal.timeout(45_000)
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'OCR.space no está disponible en este momento. Intenta de nuevo.' }, { status: 502 });
    }

    const result = (await response.json()) as OcrSpaceResponse;
    const first = result.ParsedResults?.[0];
    const rawText = first?.ParsedText?.trim() || '';
    if (result.IsErroredOnProcessing || !first || !rawText) {
      const providerMessage = toMessage(first?.ErrorMessage ?? result.ErrorMessage ?? result.ErrorDetails);
      return NextResponse.json(
        { error: providerMessage || 'OCR.space no encontró texto legible en la imagen.' },
        { status: 422 }
      );
    }

    const lines = toOcrLines(first, rawText);
    return NextResponse.json({ parsed: parseLabel(lines) });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'TimeoutError';
    return NextResponse.json(
      { error: isTimeout ? 'El reconocimiento tardó demasiado. Intenta de nuevo.' : 'No se pudo conectar con OCR.space.' },
      { status: 502 }
    );
  }
}

function toOcrLines(result: OcrSpaceResult, rawText: string): OcrLine[] {
  const overlayLines = result.TextOverlay?.Lines ?? [];
  const lines = overlayLines
    .map((line, index) => {
      const words = line.Words ?? [];
      const text = words.map((word) => word.WordText ?? '').filter(Boolean).join(' ').trim();
      if (!text) return null;
      return {
        text,
        y: line.MinTop ?? Math.min(...words.map((word) => word.Top ?? index)),
        height: Math.max(1, line.MaxHeight ?? Math.max(...words.map((word) => word.Height ?? 1))),
        // OCR.space no devuelve puntuación de confianza por línea; se usa una
        // estimación neutral para que la heurística no afirme precisión falsa.
        confidence: 60
      };
    })
    .filter((line): line is OcrLine => line !== null);

  if (lines.length) return lines;
  return rawText
    .split(/\r?\n/)
    .map((text, index) => ({ text: text.trim(), y: index, height: 1, confidence: 60 }))
    .filter((line) => line.text.length > 0);
}

function toMessage(value: string | string[] | null | undefined): string {
  if (Array.isArray(value)) return value.filter(Boolean).join(' ');
  return value?.trim() ?? '';
}
