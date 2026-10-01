'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import PourCalculator from './PourCalculator';
import { Brew, DRIPPERS, Dripper, Recipe } from '@/lib/types';

interface Props {
  coffeeId?: string | null;
  mode: 'create' | 'edit';
  brewId?: string;
  /** Valores para prellenar (al repetir/duplicar una preparación anterior, o al editar). */
  seed?: Partial<{
    brewedAt: string;
    dripper: Dripper;
    dripperOther: string;
    grindText: string;
    waterTempC: number;
    totalTimeSec: number;
    notesFlavor: string;
    notesAroma: string;
    notesBody: string;
    notesExtraction: string;
    notesChange: string;
    notesOther: string;
    doseGrams: number;
    ratio: number;
    bloomRatio: '1:2' | '1:3' | '1:4';
    pourCount: number;
  }>;
}

function toLocalDatetimeInputValue(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

export default function BrewForm({ coffeeId, mode, brewId, seed }: Props) {
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [brewedAt, setBrewedAt] = useState(toLocalDatetimeInputValue(seed?.brewedAt));
  const [dripper, setDripper] = useState<Dripper>(seed?.dripper ?? 'V60');
  const [dripperOther, setDripperOther] = useState(seed?.dripperOther ?? '');
  const [grindText, setGrindText] = useState(seed?.grindText ?? '');
  const [waterTempC, setWaterTempC] = useState<string>(
    seed?.waterTempC != null ? String(seed.waterTempC) : '93'
  );
  const [totalTimeMin, setTotalTimeMin] = useState<string>(
    seed?.totalTimeSec != null ? String(Math.floor(seed.totalTimeSec / 60)) : ''
  );
  const [totalTimeSecPart, setTotalTimeSecPart] = useState<string>(
    seed?.totalTimeSec != null ? String(seed.totalTimeSec % 60) : ''
  );
  const [notesFlavor, setNotesFlavor] = useState(seed?.notesFlavor ?? '');
  const [notesAroma, setNotesAroma] = useState(seed?.notesAroma ?? '');
  const [notesBody, setNotesBody] = useState(seed?.notesBody ?? '');
  const [notesExtraction, setNotesExtraction] = useState(seed?.notesExtraction ?? '');
  const [notesChange, setNotesChange] = useState(seed?.notesChange ?? '');
  const [notesOther, setNotesOther] = useState(seed?.notesOther ?? '');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!grindText.trim()) next.grindText = 'Describe la molienda (molino, clicks o notas).';
    if (dripper === 'Otro' && !dripperOther.trim()) next.dripperOther = 'Especifica el dripper.';
    if (!recipe || recipe.doseGrams <= 0) next.doseGrams = 'Ingresa una dosis de café válida.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !recipe) return;
    setSaving(true);
    setSubmitError(null);

    const totalTimeSec =
      totalTimeMin.trim() || totalTimeSecPart.trim()
        ? (parseInt(totalTimeMin || '0', 10) || 0) * 60 + (parseInt(totalTimeSecPart || '0', 10) || 0)
        : null;

    const payload = {
      coffeeId: coffeeId ?? null,
      brewedAt: new Date(brewedAt).toISOString(),
      dripper,
      dripperOther: dripper === 'Otro' ? dripperOther : null,
      grindText,
      waterTempC: waterTempC.trim() ? parseFloat(waterTempC) : null,
      doseGrams: recipe.doseGrams,
      ratio: recipe.ratio,
      bloomRatio: recipe.bloomRatio,
      bloomWaterG: recipe.bloomWaterG,
      pourCount: recipe.pourCount,
      totalWaterG: recipe.totalWaterG,
      pours: recipe.pours,
      totalTimeSec,
      notesFlavor: notesFlavor || null,
      notesAroma: notesAroma || null,
      notesBody: notesBody || null,
      notesExtraction: notesExtraction || null,
      notesChange: notesChange || null,
      notesOther: notesOther || null
    };

    try {
      const url = mode === 'create' ? '/api/brews' : `/api/brews/${brewId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar la preparación.');
      router.push(coffeeId ? `/cafes/${coffeeId}` : '/preparaciones');
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
        <h2 className="font-display text-lg text-ink mb-3">Calculadora de vertidos</h2>
        <PourCalculator
          initial={{
            doseGrams: seed?.doseGrams,
            ratio: seed?.ratio,
            bloomRatio: seed?.bloomRatio,
            pourCount: seed?.pourCount
          }}
          onChange={setRecipe}
        />
        {errors.doseGrams && <p className="field-error">{errors.doseGrams}</p>}
      </div>

      <div className="card p-3 sm:p-4 space-y-4">
        <h2 className="font-display text-lg text-ink">Detalles de la preparación</h2>

        <div>
          <label className="field-label" htmlFor="brewedAt">
            Fecha y hora
          </label>
          <input
            id="brewedAt"
            type="datetime-local"
            className="field-input"
            value={brewedAt}
            onChange={(e) => setBrewedAt(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="field-label" htmlFor="dripper">
            Dripper
          </label>
          <select
            id="dripper"
            className="field-input"
            value={dripper}
            onChange={(e) => setDripper(e.target.value as Dripper)}
          >
            {DRIPPERS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {dripper === 'Otro' && (
          <div>
            <label className="field-label" htmlFor="dripperOther">
              ¿Cuál?
            </label>
            <input
              id="dripperOther"
              className="field-input"
              value={dripperOther}
              onChange={(e) => setDripperOther(e.target.value)}
              aria-invalid={!!errors.dripperOther}
              placeholder="Ej. Kalita Wave, Chemex…"
            />
            {errors.dripperOther && <p className="field-error">{errors.dripperOther}</p>}
          </div>
        )}

        <div>
          <label className="field-label" htmlFor="grindText">
            Molienda
          </label>
          <input
            id="grindText"
            className="field-input"
            value={grindText}
            onChange={(e) => setGrindText(e.target.value)}
            aria-invalid={!!errors.grindText}
            placeholder="Ej. Comandante, 24 clicks — media-fina"
          />
          {errors.grindText && <p className="field-error">{errors.grindText}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="field-label" htmlFor="waterTempC">
              Temp. agua (°C)
            </label>
            <input
              id="waterTempC"
              type="number"
              inputMode="decimal"
              step={0.5}
              className="field-input"
              value={waterTempC}
              onChange={(e) => setWaterTempC(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="totalTimeMin">
              Tiempo (min)
            </label>
            <input
              id="totalTimeMin"
              type="number"
              inputMode="numeric"
              min={0}
              className="field-input"
              value={totalTimeMin}
              onChange={(e) => setTotalTimeMin(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="totalTimeSecPart">
              (seg)
            </label>
            <input
              id="totalTimeSecPart"
              type="number"
              inputMode="numeric"
              min={0}
              max={59}
              className="field-input"
              value={totalTimeSecPart}
              onChange={(e) => setTotalTimeSecPart(e.target.value)}
              placeholder="Opcional"
            />
          </div>
        </div>
      </div>

      <div className="card p-3 sm:p-4 space-y-4">
        <h2 className="font-display text-lg text-ink">Observaciones</h2>
        <TextField label="Sabor" value={notesFlavor} onChange={setNotesFlavor} />
        <TextField label="Aroma" value={notesAroma} onChange={setNotesAroma} />
        <TextField label="Cuerpo" value={notesBody} onChange={setNotesBody} />
        <TextField
          label="Extracción"
          value={notesExtraction}
          onChange={setNotesExtraction}
          placeholder="Ej. equilibrada, subextraída, sobreextraída, amarga, ácida…"
        />
        <TextField label="Qué cambiarías la próxima vez" value={notesChange} onChange={setNotesChange} />
        <TextField label="Otras notas" value={notesOther} onChange={setNotesOther} />
      </div>

      {submitError && (
        <div className="rounded-md bg-danger/10 border border-danger/30 text-danger text-sm px-3 py-2">
          {submitError}
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={saving}>
          {saving ? 'Guardando…' : mode === 'create' ? 'Guardar preparación' : 'Guardar cambios'}
        </button>
        <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => router.back()} disabled={saving}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const id = `f-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        className="field-input min-h-[2.5rem]"
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
