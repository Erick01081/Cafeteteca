import { notFound } from 'next/navigation';
import { getBrew, getCoffee } from '@/lib/repo';
import BrewForm from '@/components/BrewForm';

export const dynamic = 'force-dynamic';

export default async function PrepararPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { desde?: string };
}) {
  const coffee = await getCoffee(params.id);
  if (!coffee) notFound();

  let seed: any = undefined;
  let fromLabel: string | null = null;

  if (searchParams.desde) {
    const base = await getBrew(searchParams.desde);
    if (base && base.coffeeId === params.id) {
      seed = {
        dripper: base.dripper,
        dripperOther: base.dripperOther ?? undefined,
        grindText: base.grindText,
        waterTempC: base.waterTempC ?? undefined,
        doseGrams: base.doseGrams,
        ratio: base.ratio,
        bloomRatio: base.bloomRatio,
        pourCount: base.pourCount
      };
      fromLabel = new Date(base.brewedAt).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl text-ink">Nueva preparación</h1>
        <p className="text-sm text-inkmuted mt-1">{coffee.name}</p>
        {fromLabel && (
          <p className="text-xs text-roast-600 mt-1">
            Partiendo de la preparación del {fromLabel}. Ajusta lo que quieras comparar.
          </p>
        )}
      </div>
      <BrewForm coffeeId={coffee.id} mode="create" seed={seed} />
    </div>
  );
}
