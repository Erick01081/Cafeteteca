'use client';

import { ReactNode, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { calculateRecipe } from '@/lib/calculator';
import { BLOOM_RATIOS, BloomRatio, Preparation } from '@/lib/types';

export default function PreparationForm({ preparation }: { preparation: Preparation }) {
  const router = useRouter();
  const [brewedAt, setBrewedAt] = useState(toDatetimeLocal(preparation.brewedAt));
  const [dripper, setDripper] = useState(preparation.dripper);
  const [dripperOther, setDripperOther] = useState(preparation.dripperOther ?? '');
  const [grindText, setGrindText] = useState(preparation.grindText);
  const [waterTempC, setWaterTempC] = useState(preparation.waterTempC != null ? String(preparation.waterTempC) : '');
  const [dose, setDose] = useState(String(preparation.doseGrams));
  const [ratio, setRatio] = useState(String(preparation.ratio));
  const [bloomRatio, setBloomRatio] = useState<BloomRatio>(preparation.bloomRatio);
  const [pourCount, setPourCount] = useState(String(preparation.pourCount));
  const [totalTimeSec, setTotalTimeSec] = useState(preparation.totalTimeSec != null ? String(preparation.totalTimeSec) : '');
  const [notesFlavor, setNotesFlavor] = useState(preparation.notesFlavor ?? '');
  const [notesAroma, setNotesAroma] = useState(preparation.notesAroma ?? '');
  const [notesBody, setNotesBody] = useState(preparation.notesBody ?? '');
  const [notesExtraction, setNotesExtraction] = useState(preparation.notesExtraction ?? '');
  const [notesChange, setNotesChange] = useState(preparation.notesChange ?? '');
  const [notesOther, setNotesOther] = useState(preparation.notesOther ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doseN = num(dose);
  const ratioN = num(ratio);
  const pourCountN = intNum(pourCount);
  const isRecipeValid = doseN > 0 && ratioN > 0 && pourCountN >= 0;

  const recipe = useMemo(
    () => calculateRecipe({ doseGrams: doseN, ratio: ratioN, bloomRatio, pourCount: Math.max(0, pourCountN) }),
    [doseN, ratioN, bloomRatio, pourCountN]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dripper.trim() || !grindText.trim()) {
      setError('Método y molienda son obligatorios.');
      return;
    }
    if (!isRecipeValid) {
      setError('La dosis, el ratio y los vertidos deben ser válidos.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/preparaciones/${preparation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coffeeId: preparation.coffeeId,
          brewedAt,
          dripper: dripper.trim(),
          dripperOther,
          grindText: grindText.trim(),
          waterTempC,
          doseGrams: recipe.doseGrams,
          ratio: recipe.ratio,
          bloomRatio,
          bloomWaterG: recipe.bloomWaterG,
          pourCount: recipe.pourCount,
          totalWaterG: recipe.totalWaterG,
          pours: recipe.pours,
          totalTimeSec,
          notesFlavor,
          notesAroma,
          notesBody,
          notesExtraction,
          notesChange,
          notesOther
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar la receta.');
      router.push(`/preparaciones/${preparation.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar la receta.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="card p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Field label="Fecha y hora" id="brewedAt">
          <input id="brewedAt" type="datetime-local" className="field-input" value={brewedAt} onChange={(e) => setBrewedAt(e.target.value)} />
        </Field>
        <Field label="Método" id="dripper">
          <input id="dripper" className="field-input" value={dripper} onChange={(e) => setDripper(e.target.value)} required />
        </Field>
        <Field label="Método (otro)" id="dripperOther">
          <input id="dripperOther" className="field-input" value={dripperOther} onChange={(e) => setDripperOther(e.target.value)} />
        </Field>
        <Field label="Molienda" id="grindText">
          <input id="grindText" className="field-input" value={grindText} onChange={(e) => setGrindText(e.target.value)} required />
        </Field>
        <Field label="Temperatura (°C)" id="waterTempC">
          <input id="waterTempC" type="number" className="field-input" value={waterTempC} onChange={(e) => setWaterTempC(e.target.value)} />
        </Field>
        <Field label="Tiempo total (s)" id="totalTimeSec">
          <input id="totalTimeSec" type="number" className="field-input" value={totalTimeSec} onChange={(e) => setTotalTimeSec(e.target.value)} />
        </Field>
      </div>

      <div className="card p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Field label="Dosis (g)" id="dose">
          <input id="dose" type="number" step="0.1" className="field-input" value={dose} onChange={(e) => setDose(e.target.value)} />
        </Field>
        <Field label="Ratio" id="ratio">
          <input id="ratio" type="number" step="0.1" className="field-input" value={ratio} onChange={(e) => setRatio(e.target.value)} />
        </Field>
        <Field label="Bloom" id="bloomRatio">
          <select id="bloomRatio" className="field-input" value={bloomRatio} onChange={(e) => setBloomRatio(e.target.value as BloomRatio)}>
            {BLOOM_RATIOS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </Field>
        <Field label="Vertidos" id="pourCount">
          <input id="pourCount" type="number" min={0} className="field-input" value={pourCount} onChange={(e) => setPourCount(e.target.value)} />
        </Field>
        <div className="sm:col-span-2 rounded-md bg-roast-50/60 border border-line p-3 text-sm">
          <p className="text-ink"><span className="text-inkmuted">Agua total:</span> {recipe.totalWaterG} g</p>
          <p className="text-ink"><span className="text-inkmuted">Bloom:</span> {recipe.bloomWaterG} g</p>
        </div>
      </div>

      <div className="card p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <TextArea id="notesFlavor" label="Sabor" value={notesFlavor} onChange={setNotesFlavor} />
        <TextArea id="notesAroma" label="Aroma" value={notesAroma} onChange={setNotesAroma} />
        <TextArea id="notesBody" label="Cuerpo" value={notesBody} onChange={setNotesBody} />
        <TextArea id="notesExtraction" label="Extracción" value={notesExtraction} onChange={setNotesExtraction} />
        <TextArea id="notesChange" label="Qué cambiar" value={notesChange} onChange={setNotesChange} />
        <TextArea id="notesOther" label="Notas adicionales" value={notesOther} onChange={setNotesOther} />
      </div>

      {error && <p className="field-error" role="alert">{error}</p>}

      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => router.back()} disabled={saving}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      {children}
    </div>
  );
}

function TextArea({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <textarea id={id} rows={3} className="field-input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function num(v: string): number {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function intNum(v: string): number {
  const n = parseInt(v, 10);
  return Number.isInteger(n) ? n : -1;
}

function toDatetimeLocal(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
