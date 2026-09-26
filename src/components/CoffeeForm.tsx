'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import PhotoCapture from './PhotoCapture';
import { ProcessedImage } from '@/lib/clientImage';
import { recognizeLabelWithApi } from '@/lib/clientOcr';
import { Coffee, OcrFieldsFound } from '@/lib/types';

interface FieldsState {
  name: string;
  roaster: string;
  variety: string;
  country: string;
  region: string;
  municipality: string;
  farm: string;
  producer: string;
  process: string;
  altitude: string;
  tastingNotes: string;
}

const EMPTY_FIELDS: FieldsState = {
  name: '',
  roaster: '',
  variety: '',
  country: '',
  region: '',
  municipality: '',
  farm: '',
  producer: '',
  process: '',
  altitude: '',
  tastingNotes: ''
};

const FIELD_LABELS: Record<keyof FieldsState, string> = {
  name: 'Nombre del café / microlote',
  roaster: 'Tostador o marca',
  variety: 'Variedad',
  country: 'País',
  region: 'Departamento / región',
  municipality: 'Municipio',
  farm: 'Finca',
  producer: 'Productor',
  process: 'Proceso / fermentación',
  altitude: 'Altitud',
  tastingNotes: 'Notas de cata / perfil'
};

interface Props {
  mode: 'create' | 'edit';
  coffeeId?: string;
  initialCoffee?: Coffee;
}

type OcrStatus = 'idle' | 'processing' | 'done' | 'error';

export default function CoffeeForm({ mode, coffeeId, initialCoffee }: Props) {
  const router = useRouter();

  const [photo, setPhoto] = useState<ProcessedImage | null>(
    initialCoffee?.photoPath
      ? { dataUrl: `/api/uploads/${initialCoffee.photoPath}`, width: 0, height: 0 }
      : null
  );
  const [photoChanged, setPhotoChanged] = useState(false);
  const [photoRemoved, setPhotoRemoved] = useState(false);

  const [fields, setFields] = useState<FieldsState>({
    name: initialCoffee?.name ?? '',
    roaster: initialCoffee?.roaster ?? '',
    variety: initialCoffee?.variety ?? '',
    country: initialCoffee?.country ?? '',
    region: initialCoffee?.region ?? '',
    municipality: initialCoffee?.municipality ?? '',
    farm: initialCoffee?.farm ?? '',
    producer: initialCoffee?.producer ?? '',
    process: initialCoffee?.process ?? '',
    altitude: initialCoffee?.altitude ?? '',
    tastingNotes: initialCoffee?.tastingNotes ?? ''
  });

  const [detected, setDetected] = useState<Partial<Record<keyof FieldsState, boolean>>>({});
  const [ocrStatus, setOcrStatus] = useState<OcrStatus>('idle');
  const [ocrMessage, setOcrMessage] = useState<string | null>(null);
  const [ocrRawText, setOcrRawText] = useState<string | null>(initialCoffee?.ocrRawText ?? null);
  const [ocrConfidence, setOcrConfidence] = useState<string | null>(initialCoffee?.ocrConfidence ?? null);
  const [ocrFieldsFound, setOcrFieldsFound] = useState<OcrFieldsFound | null>(
    initialCoffee?.ocrFieldsFound ?? null
  );

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handlePhotoChange(img: ProcessedImage | null) {
    setPhoto(img);
    setPhotoChanged(true);
    setPhotoRemoved(img === null);
    setDetected({});
    setOcrStatus('idle');
    setOcrMessage(null);

    if (!img) return;
    await runOcr(img.dataUrl);
  }

  async function runOcr(dataUrl: string) {
    setOcrStatus('processing');
    setOcrMessage('Enviando la foto al lector…');
    try {
      const result = await recognizeLabelWithApi(dataUrl, (progress) => {
        if (progress.status === 'uploading') setOcrMessage('Enviando la foto a OCR.space…');
        else if (progress.status === 'processing') setOcrMessage('OCR.space está leyendo la etiqueta…');
      });

      // Solo rellena campos que la persona aún no había escrito, para no pisar ediciones.
      setFields((prev) => {
        const next = { ...prev };
        const newlyDetected: Partial<Record<keyof FieldsState, boolean>> = {};
        (Object.keys(EMPTY_FIELDS) as (keyof FieldsState)[]).forEach((key) => {
          const value = result.fields[key];
          if (value && !prev[key].trim()) {
            next[key] = value;
            newlyDetected[key] = true;
          }
        });
        setDetected(newlyDetected);
        return next;
      });

      setOcrRawText(result.rawText || null);
      setOcrConfidence(result.confidence || null);
      setOcrFieldsFound(result.fieldsFound);
      setOcrStatus('done');

      const foundCount = Object.values(result.fieldsFound).filter(Boolean).length;
      setOcrMessage(
        foundCount > 0
          ? `Se detectaron ${foundCount} de ${Object.keys(result.fieldsFound).length} campos. Revísalos antes de guardar.`
          : 'No se detectó texto claro en la etiqueta. Completa los datos manualmente.'
      );
    } catch (err: any) {
      setOcrStatus('error');
      setOcrMessage(`${err?.message || 'No se pudo leer la etiqueta.'} Puedes completar los datos manualmente.`);
    }
  }

  function updateField(key: keyof FieldsState, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    // Si la persona edita un campo detectado, deja de marcarse como "propuesto sin revisar".
    setDetected((prev) => (prev[key] ? { ...prev, [key]: false } : prev));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!fields.name.trim()) next.name = 'Ingresa un nombre para identificar este café.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setSubmitError(null);

    const payload: any = {
      name: fields.name.trim(),
      roaster: fields.roaster,
      variety: fields.variety,
      country: fields.country,
      region: fields.region,
      municipality: fields.municipality,
      farm: fields.farm,
      producer: fields.producer,
      process: fields.process,
      altitude: fields.altitude,
      tastingNotes: fields.tastingNotes,
      ocrRawText,
      ocrConfidence,
      ocrFieldsFound
    };

    if (photoChanged) {
      payload.photoDataUrl = photoRemoved ? null : photo?.dataUrl ?? null;
      payload.photoWidth = photo?.width ?? null;
      payload.photoHeight = photo?.height ?? null;
    }

    try {
      const url = mode === 'create' ? '/api/coffees' : `/api/coffees/${coffeeId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar el café.');
      router.push(`/cafes/${data.coffee.id}`);
      router.refresh();
    } catch (err: any) {
      setSubmitError(err.message || 'Ocurrió un error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div>
        <h2 className="font-display text-lg text-ink mb-3">Foto del empaque</h2>
        <PhotoCapture value={photo} onChange={handlePhotoChange} disabled={saving} />

        {ocrStatus === 'processing' && (
          <p className="text-sm text-roast-600 mt-2 flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-roast-500 border-t-transparent animate-spin" />
            {ocrMessage || 'Leyendo la etiqueta…'}
          </p>
        )}
        {ocrStatus === 'done' && ocrMessage && (
          <p className="text-sm text-cherry-600 mt-2">{ocrMessage}</p>
        )}
        {ocrStatus === 'error' && ocrMessage && (
          <p className="text-sm text-danger mt-2">{ocrMessage}</p>
        )}
      </div>

      <div className="card p-3 sm:p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">Datos del café</h2>
          {ocrStatus === 'done' && (
            <span className="chip">
              Confianza del reconocimiento: {ocrConfidence === 'alta' ? 'alta' : ocrConfidence === 'baja' ? 'baja' : 'media'}
            </span>
          )}
        </div>
        <p className="text-xs text-inkmuted -mt-2">
          Los campos marcados como "detectado" vienen del reconocimiento automático: revísalos, no son
          definitivos hasta que guardes.
        </p>

        <Field
          id="name"
          label={FIELD_LABELS.name}
          value={fields.name}
          onChange={(v) => updateField('name', v)}
          detected={!!detected.name}
          required
          error={errors.name}
        />
        <Field
          id="roaster"
          label={FIELD_LABELS.roaster}
          value={fields.roaster}
          onChange={(v) => updateField('roaster', v)}
          detected={!!detected.roaster}
        />
        <Field
          id="variety"
          label={FIELD_LABELS.variety}
          value={fields.variety}
          onChange={(v) => updateField('variety', v)}
          detected={!!detected.variety}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Field
            id="country"
            label={FIELD_LABELS.country}
            value={fields.country}
            onChange={(v) => updateField('country', v)}
            detected={!!detected.country}
          />
          <Field
            id="region"
            label={FIELD_LABELS.region}
            value={fields.region}
            onChange={(v) => updateField('region', v)}
            detected={!!detected.region}
          />
          <Field
            id="municipality"
            label={FIELD_LABELS.municipality}
            value={fields.municipality}
            onChange={(v) => updateField('municipality', v)}
            detected={!!detected.municipality}
          />
          <Field
            id="farm"
            label={FIELD_LABELS.farm}
            value={fields.farm}
            onChange={(v) => updateField('farm', v)}
            detected={!!detected.farm}
          />
        </div>

        <Field
          id="producer"
          label={FIELD_LABELS.producer}
          value={fields.producer}
          onChange={(v) => updateField('producer', v)}
          detected={!!detected.producer}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Field
            id="process"
            label={FIELD_LABELS.process}
            value={fields.process}
            onChange={(v) => updateField('process', v)}
            detected={!!detected.process}
            placeholder="Lavado, natural, anaeróbico…"
          />
          <Field
            id="altitude"
            label={FIELD_LABELS.altitude}
            value={fields.altitude}
            onChange={(v) => updateField('altitude', v)}
            detected={!!detected.altitude}
            placeholder="Ej. 1800 msnm"
          />
        </div>

        <Field
          id="tastingNotes"
          label={FIELD_LABELS.tastingNotes}
          value={fields.tastingNotes}
          onChange={(v) => updateField('tastingNotes', v)}
          detected={!!detected.tastingNotes}
          textarea
          placeholder="Ej. limoncillo, toronja, cardamomo, canela, anís"
        />

        {ocrRawText && (
          <details className="text-sm">
            <summary className="cursor-pointer text-inkmuted">Ver texto leído de la etiqueta</summary>
            <p className="mt-2 whitespace-pre-wrap text-inkmuted bg-parchment rounded-md p-3 text-xs">
              {ocrRawText}
            </p>
          </details>
        )}
      </div>

      {submitError && (
        <div className="rounded-md bg-danger/10 border border-danger/30 text-danger text-sm px-3 py-2">
          {submitError}
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={saving}>
          {saving ? 'Guardando…' : mode === 'create' ? 'Guardar café' : 'Guardar cambios'}
        </button>
        <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => router.back()} disabled={saving}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  detected,
  required,
  error,
  textarea,
  placeholder
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  detected?: boolean;
  required?: boolean;
  error?: string;
  textarea?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <label className="field-label !mb-0" htmlFor={id}>
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
        {detected && <span className="chip !text-roast-600 !border-roast-300">detectado</span>}
      </div>
      {textarea ? (
        <textarea
          id={id}
          className="field-input"
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={!!error}
        />
      ) : (
        <input
          id={id}
          className="field-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={!!error}
        />
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
