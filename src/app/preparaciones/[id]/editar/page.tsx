import { notFound } from 'next/navigation';
import { getBrew, getCoffee } from '@/lib/repo';
import BrewForm from '@/components/BrewForm';

export const dynamic = 'force-dynamic';

export default async function EditarPreparacionPage({ params }: { params: { id: string } }) {
  const brew = await getBrew(params.id);
  if (!brew) notFound();
  const coffee = brew.coffeeId ? await getCoffee(brew.coffeeId) : null;
  if (brew.coffeeId && !coffee) notFound();

  const seed = {
    brewedAt: brew.brewedAt,
    dripper: brew.dripper,
    dripperOther: brew.dripperOther ?? undefined,
    grindText: brew.grindText,
    waterTempC: brew.waterTempC ?? undefined,
    totalTimeSec: brew.totalTimeSec ?? undefined,
    notesFlavor: brew.notesFlavor ?? undefined,
    notesAroma: brew.notesAroma ?? undefined,
    notesBody: brew.notesBody ?? undefined,
    notesExtraction: brew.notesExtraction ?? undefined,
    notesChange: brew.notesChange ?? undefined,
    notesOther: brew.notesOther ?? undefined,
    doseGrams: brew.doseGrams,
    ratio: brew.ratio,
    bloomRatio: brew.bloomRatio,
    pourCount: brew.pourCount
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl text-ink">Editar preparación</h1>
        <p className="text-sm text-inkmuted mt-1">{coffee?.name ?? 'Sin café asociado'}</p>
      </div>
      <BrewForm coffeeId={coffee?.id ?? null} mode="edit" brewId={brew.id} seed={seed} />
    </div>
  );
}
