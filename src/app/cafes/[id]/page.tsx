import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCoffee, listBrewsForCoffee } from '@/lib/repo';
import BrewCard from '@/components/BrewCard';
import DeleteCoffeeButton from '@/components/DeleteCoffeeButton';
import DatabaseErrorNotice from '@/components/DatabaseErrorNotice';

export const dynamic = 'force-dynamic';

export default async function CoffeeDetailPage({ params }: { params: { id: string } }) {
  let coffee;
  let brews;
  try {
    coffee = await getCoffee(params.id);
    if (!coffee) notFound();
    brews = await listBrewsForCoffee(params.id);
  } catch (err: any) {
    if (err?.digest === 'NEXT_NOT_FOUND') throw err;
    return <DatabaseErrorNotice message={err?.message || 'Error desconocido.'} />;
  }

  const originParts = [coffee.municipality, coffee.region, coffee.country].filter(Boolean);

  const detailRows: [string, string | null][] = [
    ['Tostador', coffee.roaster],
    ['Variedad', coffee.variety],
    ['Origen', originParts.length ? originParts.join(', ') : null],
    ['Finca', coffee.farm],
    ['Productor', coffee.producer],
    ['Proceso', coffee.process],
    ['Altitud', coffee.altitude]
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="h-40 w-40 shrink-0 mx-auto sm:mx-0 rounded-lg overflow-hidden bg-roast-50 border border-line">
          {coffee.photoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/uploads/${coffee.photoPath}`}
              alt={`Empaque de ${coffee.name}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-roast-300 text-4xl">☕</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h1 className="font-display text-2xl text-ink">{coffee.name}</h1>
            {coffee.isSample && <span className="chip">dato de ejemplo</span>}
          </div>
          <dl className="mt-2 space-y-0.5 text-sm">
            {detailRows
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <div key={label} className="flex gap-1.5">
                  <dt className="text-inkmuted">{label}:</dt>
                  <dd className="text-ink">{value}</dd>
                </div>
              ))}
          </dl>
          {coffee.tastingNotes && (
            <p className="mt-2 text-sm">
              <span className="text-inkmuted">Perfil: </span>
              <span className="text-ink">{coffee.tastingNotes}</span>
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/cafes/${coffee.id}/preparar`} className="btn-primary">
              Nueva preparación
            </Link>
            <Link href={`/cafes/${coffee.id}/editar`} className="btn-secondary">
              Editar café
            </Link>
            <DeleteCoffeeButton coffeeId={coffee.id} coffeeName={coffee.name} />
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg text-ink mb-3">
          Preparaciones {brews.length > 0 && <span className="text-inkmuted font-body text-sm">({brews.length})</span>}
        </h2>
        {brews.length === 0 ? (
          <div className="card p-6 text-center text-sm text-inkmuted">
            Todavía no has preparado este café.{' '}
            <Link href={`/cafes/${coffee.id}/preparar`} className="text-roast-600 underline">
              Registra la primera preparación
            </Link>
            .
          </div>
        ) : (
          <div className="space-y-3">
            {brews.map((b) => (
              <BrewCard key={b.id} brew={b} coffeeId={coffee.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
