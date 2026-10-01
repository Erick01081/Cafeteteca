import Link from 'next/link';
import { notFound } from 'next/navigation';
import DatabaseErrorNotice from '@/components/DatabaseErrorNotice';
import { getPreparation } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export default async function PreparationDetailPage({ params }: { params: { id: string } }) {
  let preparation;
  try {
    preparation = await getPreparation(params.id);
  } catch (err: any) {
    return <DatabaseErrorNotice message={err?.message || 'Error desconocido.'} />;
  }
  if (!preparation) notFound();

  const brewedAtText = new Date(preparation.brewedAt).toLocaleString('es-CO', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  return (
    <div className="space-y-5">
      <Link
        href={preparation.coffeeId ? `/cafes/${preparation.coffeeId}` : '/'}
        className="text-sm text-roast-600 hover:underline"
      >
        ← Volver
      </Link>

      <section className="card p-4 sm:p-5 space-y-4">
        <div>
          <h1 className="font-display text-2xl text-ink">Receta (solo visualización)</h1>
          <p className="text-sm text-inkmuted mt-1">{brewedAtText}</p>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div><dt className="text-inkmuted">Método</dt><dd className="text-ink">{preparation.dripper}</dd></div>
          <div><dt className="text-inkmuted">Molienda</dt><dd className="text-ink">{preparation.grindText}</dd></div>
          <div><dt className="text-inkmuted">Dosis</dt><dd className="text-ink">{preparation.doseGrams} g</dd></div>
          <div><dt className="text-inkmuted">Ratio</dt><dd className="text-ink">1:{preparation.ratio}</dd></div>
          <div><dt className="text-inkmuted">Bloom</dt><dd className="text-ink">{preparation.bloomRatio} ({preparation.bloomWaterG} g)</dd></div>
          <div><dt className="text-inkmuted">Agua total</dt><dd className="text-ink">{preparation.totalWaterG} g</dd></div>
        </dl>

        <div>
          <h2 className="font-display text-lg text-ink mb-2">Pasos</h2>
          <ol className="space-y-1.5">
            {preparation.pours.map((p) => (
              <li key={`${p.n}-${p.label}`} className="rounded-md bg-roast-50/60 px-3 py-2 text-sm text-ink">
                <span className="font-medium">{p.label}</span>{' '}
                <span className="text-inkmuted">+{p.stepWaterG} g → {p.cumulativeWaterG} g</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
