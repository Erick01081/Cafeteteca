import Link from 'next/link';
import { getBrew } from '@/lib/repo';
import BrewForm from '@/components/BrewForm';

export const dynamic = 'force-dynamic';

export default async function NuevaPreparacionPage({ searchParams }: { searchParams: { desde?: string } }) {
  const base = searchParams.desde ? await getBrew(searchParams.desde) : null;
  const seed = base ? {
    dripper: base.dripper,
    dripperOther: base.dripperOther ?? undefined,
    grindText: base.grindText,
    waterTempC: base.waterTempC ?? undefined,
    doseGrams: base.doseGrams,
    ratio: base.ratio,
    bloomRatio: base.bloomRatio,
    pourCount: base.pourCount
  } : undefined;
  const fromLabel = base ? new Date(base.brewedAt).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric'
  }) : null;

  return (
    <div className="space-y-5">
      <div>
        <Link href="/" className="text-sm text-roast-600 hover:underline">← Volver</Link>
        <h1 className="font-display text-2xl text-ink mt-2">Nueva preparación</h1>
        <p className="text-sm text-inkmuted mt-1">Calcula y guarda la receta sin asociarla a un café.</p>
        {fromLabel && <p className="text-xs text-roast-600 mt-1">Partiendo de la preparación del {fromLabel}.</p>}
      </div>
      <BrewForm mode="create" seed={seed} />
    </div>
  );
}
