import { BloomRatio, PourStep, Recipe } from './types';

const BLOOM_MULTIPLIER: Record<BloomRatio, number> = {
  '1:2': 2,
  '1:3': 3,
  '1:4': 4
};

export function bloomMultiplier(ratio: BloomRatio): number {
  return BLOOM_MULTIPLIER[ratio];
}

/**
 * Calcula la receta completa a partir de los parámetros base.
 * - El bloom se calcula como dosis * multiplicador del bloom (ej. 1:3 => dosis * 3).
 * - El agua restante (total - bloom) se reparte en partes iguales entre los vertidos.
 * - Los pesos son acumulados (lo que debe marcar la báscula), no incrementales.
 */
export function calculateRecipe(params: {
  doseGrams: number;
  ratio: number;
  bloomRatio: BloomRatio;
  pourCount: number;
}): Recipe {
  const { doseGrams, ratio, bloomRatio, pourCount } = params;

  const safeDose = Math.max(0, doseGrams || 0);
  const safeRatio = Math.max(0, ratio || 0);
  const safePourCount = Math.max(1, Math.round(pourCount || 1));

  const totalWaterG = round1(safeDose * safeRatio);
  let bloomWaterG = round1(safeDose * bloomMultiplier(bloomRatio));
  if (bloomWaterG > totalWaterG) bloomWaterG = totalWaterG;

  const remaining = Math.max(0, totalWaterG - bloomWaterG);
  const perPour = remaining / safePourCount;

  const pours: PourStep[] = [
    { n: 0, label: 'Bloom', stepWaterG: bloomWaterG, cumulativeWaterG: bloomWaterG }
  ];

  let cumulative = bloomWaterG;
  for (let i = 1; i <= safePourCount; i++) {
    // El último vertido absorbe el redondeo para que el acumulado final sea exacto.
    const isLast = i === safePourCount;
    const stepWaterG = isLast ? round1(totalWaterG - cumulative) : round1(perPour);
    cumulative = round1(cumulative + stepWaterG);
    pours.push({
      n: i,
      label: `Vertido ${i}`,
      stepWaterG,
      cumulativeWaterG: cumulative
    });
  }

  return {
    doseGrams: safeDose,
    ratio: safeRatio,
    bloomRatio,
    bloomWaterG,
    pourCount: safePourCount,
    totalWaterG,
    pours
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
