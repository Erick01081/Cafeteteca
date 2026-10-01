'use client';

import { useEffect, useMemo, useState } from 'react';
import { calculateRecipe } from '@/lib/calculator';
import { BLOOM_RATIOS, BloomRatio } from '@/lib/types';

const RATIO_PRESETS = [15, 16, 17];
const STORAGE_KEY = 'cafeteca:calculadora';
const DEFAULTS = { dose: '15', ratio: '16', bloom: '1:3' as BloomRatio, pours: 3 };

function num(v: string): number {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export default function PourCalculator() {
  const [dose, setDose] = useState(DEFAULTS.dose);
  const [ratio, setRatio] = useState(DEFAULTS.ratio);
  const [bloom, setBloom] = useState<BloomRatio>(DEFAULTS.bloom);
  const [pours, setPours] = useState(DEFAULTS.pours);
  const [done, setDone] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Recuerda los últimos valores usados en este dispositivo.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved) {
        if (typeof saved.dose === 'string') setDose(saved.dose);
        if (typeof saved.ratio === 'string') setRatio(saved.ratio);
        if (BLOOM_RATIOS.includes(saved.bloom)) setBloom(saved.bloom);
        if (Number.isInteger(saved.pours)) setPours(Math.min(10, Math.max(1, saved.pours)));
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ dose, ratio, bloom, pours }));
    } catch {}
  }, [dose, ratio, bloom, pours, loaded]);

  const doseN = num(dose);
  const ratioN = num(ratio);
  const valid = doseN > 0 && ratioN > 0;

  const recipe = useMemo(
    () => calculateRecipe({ doseGrams: doseN, ratio: ratioN, bloomRatio: bloom, pourCount: pours }),
    [doseN, ratioN, bloom, pours]
  );

  // Si cambia la receta, el progreso marcado deja de ser válido.
  useEffect(() => setDone([]), [doseN, ratioN, bloom, pours]);

  function toggle(n: number) {
    setDone((d) => (d.includes(n) ? d.filter((x) => x !== n) : [...d, n]));
  }

  function reset() {
    setDose(DEFAULTS.dose);
    setRatio(DEFAULTS.ratio);
    setBloom(DEFAULTS.bloom);
    setPours(DEFAULTS.pours);
  }

  async function copy() {
    const text = [
      `${recipe.doseGrams} g de café · 1:${recipe.ratio} · ${recipe.totalWaterG} g de agua`,
      ...recipe.pours.map((p) => `${p.label}: +${p.stepWaterG} g → ${p.cumulativeWaterG} g`)
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="space-y-4">
      <div className="card p-3 sm:p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="field-label" htmlFor="doseGrams">Café (g)</label>
            <input
              id="doseGrams"
              type="text"
              inputMode="decimal"
              className="field-input"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              aria-invalid={!doseN}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="ratio">Ratio (g de agua por g de café)</label>
            <input
              id="ratio"
              type="text"
              inputMode="decimal"
              className="field-input"
              value={ratio}
              onChange={(e) => setRatio(e.target.value)}
              aria-invalid={!ratioN}
            />
            <div className="flex gap-2 mt-2" role="group" aria-label="Ratios frecuentes">
              {RATIO_PRESETS.map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={ratioN === r}
                  onClick={() => setRatio(String(r))}
                  className={`chip min-h-9 px-3 ${ratioN === r ? '!bg-roast-500 !text-white !border-roast-500' : ''}`}
                >
                  1:{r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="field-label" id="bloom-label">Bloom</span>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="bloom-label">
              {BLOOM_RATIOS.map((b) => (
                <button
                  key={b}
                  type="button"
                  role="radio"
                  aria-checked={bloom === b}
                  onClick={() => setBloom(b)}
                  className={bloom === b ? 'btn-primary' : 'btn-secondary'}
                >
                  {b}
                </button>
              ))}
            </div>
            <p className="field-hint">Agua del bloom = café × {bloom.split(':')[1]}.</p>
          </div>
          <div>
            <span className="field-label" id="pours-label">Vertidos después del bloom</span>
            <div className="flex items-center gap-2" role="group" aria-labelledby="pours-label">
              <button type="button" className="btn-secondary w-11 !px-0" aria-label="Un vertido menos" disabled={pours <= 1} onClick={() => setPours((p) => Math.max(1, p - 1))}>−</button>
              <output className="min-w-10 text-center text-lg font-display text-ink" aria-live="polite">{pours}</output>
              <button type="button" className="btn-secondary w-11 !px-0" aria-label="Un vertido más" disabled={pours >= 10} onClick={() => setPours((p) => Math.min(10, p + 1))}>+</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-3 sm:p-4">
        {!valid ? (
          <p className="text-sm text-danger" role="alert">Ingresa una dosis y un ratio mayores que 0 para ver la receta.</p>
        ) : (
          <>
            <div className="flex items-end justify-between gap-3 mb-3">
              <div>
                <p className="text-xs text-inkmuted">Agua total</p>
                <p className="font-display text-3xl text-ink leading-none">{recipe.totalWaterG} <span className="text-base text-inkmuted">g</span></p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn-secondary !py-1.5 !px-3 text-sm" onClick={copy}>
                  {copied ? '¡Copiado!' : 'Copiar'}
                </button>
                <button type="button" className="btn-secondary !py-1.5 !px-3 text-sm" onClick={reset}>
                  Reiniciar
                </button>
              </div>
            </div>
            <ol className="space-y-1.5">
              {recipe.pours.map((p) => {
                const checked = done.includes(p.n);
                return (
                  <li key={p.n}>
                    <button
                      type="button"
                      aria-pressed={checked}
                      onClick={() => toggle(p.n)}
                      className={`flex w-full min-h-11 items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        checked ? 'bg-cherry-400/15 text-inkmuted' : 'bg-roast-50/60 hover:bg-roast-50'
                      }`}
                    >
                      <span className={`flex items-center gap-2 ${checked ? 'line-through' : 'text-ink'}`}>
                        <span aria-hidden className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs ${checked ? 'bg-cherry-500 border-cherry-500 text-white' : 'border-line bg-surface'}`}>
                          {checked ? '✓' : p.n}
                        </span>
                        {p.label}
                      </span>
                      <span className="text-inkmuted">
                        +{p.stepWaterG} g <span className="text-ink font-semibold text-base">→ {p.cumulativeWaterG} g</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className="field-hint mt-2">
              "→" es el peso acumulado que debe marcar la báscula. Toca cada paso para marcarlo como hecho.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
