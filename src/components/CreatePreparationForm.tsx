'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { calculateRecipe } from '@/lib/calculator';
import { BLOOM_RATIOS, BloomRatio } from '@/lib/types';

export default function CreatePreparationForm({ coffeeId }: { coffeeId: string }) {
  const router = useRouter();
  const [dose, setDose] = useState('15');
  const [ratio, setRatio] = useState('16');
  const [bloomRatio, setBloomRatio] = useState<BloomRatio>('1:3');
  const [pourCount, setPourCount] = useState('3');
  const [dripper, setDripper] = useState('V60');
  const [dripperOther, setDripperOther] = useState('');
  const [grindText, setGrindText] = useState('');
  const [waterTempC, setWaterTempC] = useState('');
  const [totalTimeSec, setTotalTimeSec] = useState('');
  const [notesFlavor, setNotesFlavor] = useState('');
  const [notesAroma, setNotesAroma] = useState('');
  const [notesBody, setNotesBody] = useState('');
  const [notesExtraction, setNotesExtraction] = useState('');
  const [notesChange, setNotesChange] = useState('');
  const [notesOther, setNotesOther] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const doseN = number(dose);
  const ratioN = number(ratio);
  const poursN = Math.max(0, Math.min(10, integer(pourCount)));
  const recipe = useMemo(
    () => calculateRecipe({ doseGrams: doseN, ratio: ratioN, bloomRatio, pourCount: poursN }),
    [doseN, ratioN, bloomRatio, poursN]
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dripper.trim() || !grindText.trim()) {
      setError('El método y la molienda son obligatorios.');
      return;
    }
    if (doseN <= 0 || ratioN <= 0 || integer(pourCount) < 0 || integer(pourCount) > 10) {
      setError('Revisa la dosis, el ratio y la cantidad de vertidos.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/preparaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coffeeId,
          brewedAt: new Date().toISOString(),
          dripper: dripper.trim(), dripperOther, grindText: grindText.trim(), waterTempC,
          doseGrams: recipe.doseGrams, ratio: recipe.ratio, bloomRatio,
          bloomWaterG: recipe.bloomWaterG, pourCount: recipe.pourCount,
          totalWaterG: recipe.totalWaterG, pours: recipe.pours, totalTimeSec,
          notesFlavor, notesAroma, notesBody, notesExtraction, notesChange, notesOther
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar la receta.');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar la receta.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Field label="Dosis (g)"><input className="field-input" type="number" min="0.1" step="0.1" value={dose} onChange={(e) => setDose(e.target.value)} /></Field>
        <Field label="Ratio (agua por café)"><input className="field-input" type="number" min="0.1" step="0.1" value={ratio} onChange={(e) => setRatio(e.target.value)} /></Field>
        <Field label="Bloom"><select className="field-input" value={bloomRatio} onChange={(e) => setBloomRatio(e.target.value as BloomRatio)}>{BLOOM_RATIOS.map((value) => <option key={value}>{value}</option>)}</select></Field>
        <Field label="Vertidos después del bloom"><input className="field-input" type="number" min="0" max="10" value={pourCount} onChange={(e) => setPourCount(e.target.value)} /></Field>
        <Field label="Método"><input className="field-input" value={dripper} onChange={(e) => setDripper(e.target.value)} required /></Field>
        <Field label="Método (otro)"><input className="field-input" value={dripperOther} onChange={(e) => setDripperOther(e.target.value)} /></Field>
        <Field label="Molienda"><input className="field-input" value={grindText} onChange={(e) => setGrindText(e.target.value)} required /></Field>
        <Field label="Temperatura del agua (°C)"><input className="field-input" type="number" step="0.1" value={waterTempC} onChange={(e) => setWaterTempC(e.target.value)} /></Field>
        <Field label="Tiempo total (segundos)"><input className="field-input" type="number" min="0" value={totalTimeSec} onChange={(e) => setTotalTimeSec(e.target.value)} /></Field>
      </div>

      <div className="rounded-md bg-roast-50/60 border border-line p-3 text-sm">
        <p className="font-medium text-ink">Calculadora de vertidos · {recipe.doseGrams} g · 1:{recipe.ratio} · {recipe.totalWaterG} g de agua</p>
        <ol className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-inkmuted">
          {recipe.pours.map((pour) => <li key={pour.n}>{pour.label}: +{pour.stepWaterG} g → {pour.cumulativeWaterG} g</li>)}
        </ol>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <TextArea label="Sabor" value={notesFlavor} onChange={setNotesFlavor} />
        <TextArea label="Aroma" value={notesAroma} onChange={setNotesAroma} />
        <TextArea label="Cuerpo" value={notesBody} onChange={setNotesBody} />
        <TextArea label="Extracción" value={notesExtraction} onChange={setNotesExtraction} />
        <TextArea label="Qué cambiar" value={notesChange} onChange={setNotesChange} />
        <TextArea label="Notas adicionales" value={notesOther} onChange={setNotesOther} />
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
      <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar receta para este café'}</button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="field-label">{label}</label>{children}</div>;
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div><label className="field-label">{label}</label><textarea rows={3} className="field-input" value={value} onChange={(e) => onChange(e.target.value)} /></div>;
}

function number(value: string): number {
  const parsed = Number.parseFloat(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function integer(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : -1;
}
