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
  const [brewedDate, setBrewedDate] = useState(todayLocalDate);
  const [grindText, setGrindText] = useState('');
  const [waterTempC, setWaterTempC] = useState('');
  const [totalTimeMin, setTotalTimeMin] = useState('');
  const [totalTimeRemainderSec, setTotalTimeRemainderSec] = useState('');
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

  function resetCalculator() {
    setDose('15');
    setRatio('16');
    setBloomRatio('1:3');
    setPourCount('3');
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const minutes = totalTimeMin === '' ? 0 : integer(totalTimeMin);
    const seconds = totalTimeRemainderSec === '' ? 0 : integer(totalTimeRemainderSec);
    if (!dripper.trim() || !grindText.trim()) {
      setError('El método y la molienda son obligatorios.');
      return;
    }
    if (!brewedDate || minutes < 0 || seconds < 0 || seconds > 59) {
      setError('Revisa la fecha y el tiempo de preparación. Los segundos deben estar entre 0 y 59.');
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
          brewedAt: new Date(`${brewedDate}T00:00:00`).toISOString(),
          dripper, grindText: grindText.trim(), waterTempC,
          doseGrams: recipe.doseGrams, ratio: recipe.ratio, bloomRatio,
          bloomWaterG: recipe.bloomWaterG, pourCount: recipe.pourCount,
          totalWaterG: recipe.totalWaterG, pours: recipe.pours,
          totalTimeSec: totalTimeMin === '' && totalTimeRemainderSec === ''
            ? ''
            : minutes * 60 + seconds,
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
      <div className="card p-3 sm:p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Field label="Café (g)"><input className="field-input" type="text" inputMode="decimal" value={dose} onChange={(e) => setDose(e.target.value)} aria-invalid={!doseN} /></Field>
        <div>
          <label className="field-label">Ratio (g de agua por g de café)</label>
          <input className="field-input" type="text" inputMode="decimal" value={ratio} onChange={(e) => setRatio(e.target.value)} aria-invalid={!ratioN} />
          <div className="flex gap-2 mt-2" role="group" aria-label="Ratios frecuentes">
            {[15, 16, 17].map((preset) => <button key={preset} type="button" aria-pressed={ratioN === preset} onClick={() => setRatio(String(preset))} className={`chip min-h-9 px-3 ${ratioN === preset ? '!bg-roast-500 !text-white !border-roast-500' : ''}`}>1:{preset}</button>)}
          </div>
        </div>
        <div>
          <span className="field-label">Bloom</span>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Ratio de bloom">
            {BLOOM_RATIOS.map((value) => <button key={value} type="button" role="radio" aria-checked={bloomRatio === value} onClick={() => setBloomRatio(value)} className={bloomRatio === value ? 'btn-primary' : 'btn-secondary'}>{value}</button>)}
          </div>
          <p className="field-hint">Agua del bloom = café × {bloomRatio.split(':')[1]}.</p>
        </div>
        <div>
          <span className="field-label">Vertidos después del bloom</span>
          <div className="flex items-center gap-2" role="group" aria-label="Cantidad de vertidos">
            <button type="button" className="btn-secondary w-11 !px-0" aria-label="Un vertido menos" disabled={poursN <= 0} onClick={() => setPourCount(String(Math.max(0, poursN - 1)))}>−</button>
            <output className="min-w-10 text-center text-lg font-display text-ink" aria-live="polite">{poursN}</output>
            <button type="button" className="btn-secondary w-11 !px-0" aria-label="Un vertido más" disabled={poursN >= 10} onClick={() => setPourCount(String(Math.min(10, poursN + 1)))}>+</button>
          </div>
        </div>
        </div>
      </div>

      <div className="card p-3 sm:p-4">
        <div className="flex items-end justify-between gap-3 mb-3">
          <div>
            <p className="text-xs text-inkmuted">Agua total</p>
            <p className="font-display text-3xl text-ink leading-none">{recipe.totalWaterG} <span className="text-base text-inkmuted">g</span></p>
          </div>
          <button type="button" className="btn-secondary !py-1.5 !px-3 text-sm" onClick={resetCalculator}>Reiniciar</button>
        </div>
        <ol className="space-y-1.5">
          {recipe.pours.map((pour) => <li key={pour.n} className="flex min-h-11 items-center justify-between gap-3 rounded-md bg-roast-50/60 px-3 py-2 text-sm">
            <span className="flex items-center gap-2 text-ink"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-line bg-surface text-xs">{pour.n}</span>{pour.label}</span>
            <span className="text-inkmuted">+{pour.stepWaterG} g <span className="text-ink font-semibold text-base">→ {pour.cumulativeWaterG} g</span></span>
          </li>)}
        </ol>
        <p className="field-hint mt-2">“→” es el peso acumulado que debe marcar la báscula.</p>
      </div>

      <div className="card p-3 sm:p-4 space-y-4">
        <h2 className="font-display text-lg text-ink">Detalles de preparación</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Field label="Fecha de preparación"><input className="field-input" type="date" value={brewedDate} onChange={(e) => setBrewedDate(e.target.value)} required /></Field>
        <Field label="Método"><select className="field-input" value={dripper} onChange={(e) => setDripper(e.target.value)} required>
          {['V60', 'V60 Neo', 'Origami', 'B75', 'UFO'].map((method) => <option key={method} value={method}>{method}</option>)}
        </select></Field>
        <Field label="Molienda"><input className="field-input" value={grindText} onChange={(e) => setGrindText(e.target.value)} required /></Field>
        <Field label="Temperatura del agua (°C)"><input className="field-input" type="number" step="0.1" value={waterTempC} onChange={(e) => setWaterTempC(e.target.value)} /></Field>
        <Field label="Tiempo (min)"><input className="field-input" type="number" min="0" step="1" value={totalTimeMin} onChange={(e) => setTotalTimeMin(e.target.value)} /></Field>
        <Field label="Tiempo (seg)"><input className="field-input" type="number" min="0" max="59" step="1" value={totalTimeRemainderSec} onChange={(e) => setTotalTimeRemainderSec(e.target.value)} /></Field>
        </div>
      </div>

      <div className="card p-3 sm:p-4 space-y-4">
        <div>
          <h2 className="font-display text-lg text-ink">¿Cómo quedó esta taza?</h2>
          <p className="text-sm text-inkmuted mt-1">Registra el perfil y lo que quieras ajustar la próxima vez.</p>
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
      </div>
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

function todayLocalDate(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
