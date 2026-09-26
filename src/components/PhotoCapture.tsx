'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ProcessedImage, drawToCanvas, fileToImage } from '@/lib/clientImage';

interface Props {
  value: ProcessedImage | null;
  onChange: (img: ProcessedImage | null) => void;
  disabled?: boolean;
}

type CropRect = { x: number; y: number; w: number; h: number }; // en px de pantalla (CSS)

/**
 * Cada operación (rotar, recortar) se aplica sobre la ÚLTIMA imagen procesada,
 * no sobre el archivo original. Así rotar y luego recortar (o viceversa) siempre
 * da un resultado correcto, sin tener que arrastrar transformaciones acumuladas.
 */
export default function PhotoCapture({ value, onChange, disabled }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentImgRef = useRef<HTMLImageElement | null>(null);

  const [cropping, setCropping] = useState(false);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Si llega una foto ya guardada (modo edición), la cargamos como imagen "actual"
  // para que girar/recortar funcionen sin que la persona tenga que volver a subirla.
  useEffect(() => {
    if (value && !currentImgRef.current) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        currentImgRef.current = img;
      };
      img.src = value.dataUrl;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyAndStore = useCallback(
    async (processed: ProcessedImage) => {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('No se pudo procesar la imagen resultante.'));
        img.src = processed.dataUrl;
      });
      currentImgRef.current = img;
      onChange(processed);
    },
    [onChange]
  );

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setError(null);
      if (!file.type.startsWith('image/')) {
        setError('Selecciona un archivo de imagen (JPEG, PNG o WebP).');
        return;
      }
      setLoading(true);
      try {
        const img = await fileToImage(file);
        const processed = drawToCanvas(img, { rotationDeg: 0 });
        await applyAndStore(processed);
        setCropping(false);
        setCropRect(null);
      } catch (err: any) {
        setError(err?.message || 'No se pudo procesar la imagen.');
      } finally {
        setLoading(false);
      }
    },
    [applyAndStore]
  );

  async function applyRotation(deltaDeg: number) {
    const img = currentImgRef.current;
    if (!img) return;
    setError(null);
    const processed = drawToCanvas(img, { rotationDeg: deltaDeg });
    await applyAndStore(processed);
  }

  function startCrop() {
    setCropping(true);
    setCropRect(null);
  }

  function cancelCrop() {
    setCropping(false);
    setCropRect(null);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!cropping || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDragStart({ x, y });
    setCropRect({ x, y, w: 0, h: 0 });
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!cropping || !dragStart || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    setCropRect({
      x: Math.min(dragStart.x, x),
      y: Math.min(dragStart.y, y),
      w: Math.abs(x - dragStart.x),
      h: Math.abs(y - dragStart.y)
    });
  }

  function onPointerUp() {
    setDragStart(null);
  }

  async function applyCrop() {
    const img = currentImgRef.current;
    if (!img || !cropRect || !containerRef.current || cropRect.w < 10 || cropRect.h < 10) {
      setError('Selecciona un área más grande para recortar.');
      return;
    }
    const renderedRect = containerRef.current.getBoundingClientRect();
    // La imagen se muestra a ancho completo del contenedor (w-full h-auto), así que
    // la escala entre px de pantalla y px reales de la imagen es la misma en x e y.
    const scale = img.naturalWidth / renderedRect.width;
    const srcCrop = {
      x: Math.round(cropRect.x * scale),
      y: Math.round(cropRect.y * scale),
      w: Math.round(cropRect.w * scale),
      h: Math.round(cropRect.h * scale)
    };
    const processed = drawToCanvas(img, { rotationDeg: 0, crop: srcCrop });
    await applyAndStore(processed);
    setCropping(false);
    setCropRect(null);
  }

  function removePhoto() {
    currentImgRef.current = null;
    setCropRect(null);
    setCropping(false);
    setError(null);
    onChange(null);
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {!value && (
        <div className="border-2 border-dashed border-line rounded-lg p-6 text-center bg-surface">
          <p className="text-sm text-inkmuted mb-3">
            Toma una foto del empaque o sube una imagen que ya tengas.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              className="btn-primary"
              disabled={disabled || loading}
              onClick={() => cameraInputRef.current?.click()}
            >
              Tomar foto
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={disabled || loading}
              onClick={() => fileInputRef.current?.click()}
            >
              Subir imagen
            </button>
          </div>
          {loading && <p className="text-xs text-inkmuted mt-3">Cargando imagen…</p>}
        </div>
      )}

      {value && (
        <div className="space-y-3">
          <div
            ref={containerRef}
            className="relative rounded-lg overflow-hidden border border-line bg-black/5 touch-none select-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.dataUrl}
              alt="Foto del empaque de café"
              className="w-full h-auto block"
              draggable={false}
            />
            {cropping && cropRect && (
              <div
                className="absolute border-2 border-roast-500 bg-roast-500/10"
                style={{ left: cropRect.x, top: cropRect.y, width: cropRect.w, height: cropRect.h }}
              />
            )}
            {cropping && !cropRect && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-sm px-4 text-center">
                Arrastra sobre la imagen para marcar el área a conservar
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {!cropping && (
              <>
                <button type="button" className="btn-secondary" onClick={() => applyRotation(-90)}>
                  ↺ Girar izquierda
                </button>
                <button type="button" className="btn-secondary" onClick={() => applyRotation(90)}>
                  ↻ Girar derecha
                </button>
                <button type="button" className="btn-secondary" onClick={startCrop}>
                  Recortar
                </button>
                <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
                  Cambiar foto
                </button>
                <button type="button" className="btn-danger" onClick={removePhoto}>
                  Quitar foto
                </button>
              </>
            )}
            {cropping && (
              <>
                <button type="button" className="btn-primary" onClick={applyCrop}>
                  Aplicar recorte
                </button>
                <button type="button" className="btn-secondary" onClick={cancelCrop}>
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {error && <p className="field-error mt-2">{error}</p>}
    </div>
  );
}
