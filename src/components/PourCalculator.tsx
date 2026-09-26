'use client';

import { useEffect, useMemo, useState } from 'react';
import { calculateRecipe } from '@/lib/calculator';
import { BLOOM_RATIOS, BloomRatio, Recipe } from '@/lib/types';

interface Props {
  initial?: Partial<{
    doseGrams: number;
    ratio: number;
    bloomRatio: BloomRatio;
    pourCount: number;
  }>;
  onChange: (recipe: Recipe) => void;
}

export default function PourCalculator({ initial, onChange }: Props) {
  const [doseGrams, setDoseGrams] = useState(initial?.doseGrams ?? 15);
  const [ratio, setRatio] = useState(initial?.ratio ?? 16);
  const [bloomRatio, setBloomRatio] = useState<BloomRatio>(initial?.bloomRatio ?? '1:3');
  // Conservar el texto permite borrar el campo mientras se edita sin que
  // React lo reemplace inmediatamente por 1.
  const [pourCountInput, setPourCountInput] = useState(String(initial?.pourCount ?? 3));
  const pourCount = Math.min(10, Math.max(1, Math.round(Number(pourCountInput) || 1)));

  const recipe = useMemo(
    () => calculateRecipe({ doseGrams, ratio, bloomRatio, pourCount }),
    [doseGrams, ratio, bloomRatio, pourCount]
  );

  useEffect(() => {
    onChange(recipe);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe]);

  return (
    <div className="card p-3 sm:p-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="field-label" htmlFor="doseGrams">
            Café (g)
          </label>
          <input
            id="doseGrams"
            type="number"
            inputMode="decimal"
            min={1}
            step={0.5}
            className="field-input"
            value={doseGrams}
            onChange={(e) => setDoseGrams(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="ratio">
            Ratio (agua por g de café)
          </label>
          <input
            id="ratio"
            type="number"
            inputMode="decimal"
            min={1}
            step={0.5}
            className="field-input"
            value={ratio}
            onChange={(e) => setRatio(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="bloomRatio">
            Bloom
          </label>
          <select
            id="bloomRatio"
            className="field-input"
            value={bloomRatio}
            onChange={(e) => setBloomRatio(e.target.value as BloomRatio)}
          >
            {BLOOM_RATIOS.map((b) => (
              <option key={b} value={b}>
                {b} (café × {b.split(':')[1]})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="pourCount">
            Vertidos después del bloom
          </label>
          <input
            id="pourCount"
            type="number"
            inputMode="numeric"
            min={1}
            max={10}
            step={1}
            className="field-input"
            value={pourCountInput}
            onChange={(e) => setPourCountInput(e.target.value)}
            onBlur={() => setPourCountInput(String(pourCount))}
          />
        </div>
      </div>

      <div className="border-t border-line pt-3">
        <div className="flex justify-between text-sm text-inkmuted mb-2">
          <span>Agua total</span>
          <span className="font-medium text-ink">{recipe.totalWaterG} g</span>
        </div>
        <ol className="space-y-1.5">
          {recipe.pours.map((p) => (
            <li
              key={p.n}
              className="flex items-center justify-between rounded-sm bg-roast-50/60 px-3 py-1.5 text-sm"
            >
              <span className="text-ink">{p.label}</span>
              <span className="text-inkmuted">
                +{p.stepWaterG} g <span className="text-ink font-medium">→ {p.cumulativeWaterG} g</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="field-hint mt-2">
          "→" indica el peso acumulado que debe marcar la báscula en cada paso.
        </p>
      </div>
    </div>
  );
}
