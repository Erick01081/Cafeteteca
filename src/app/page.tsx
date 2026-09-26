import Link from 'next/link';
import { Suspense } from 'react';
import { listCoffeesWithBrewCount } from '@/lib/repo';
import CoffeeCard from '@/components/CoffeeCard';
import SearchBar from '@/components/SearchBar';
import DatabaseErrorNotice from '@/components/DatabaseErrorNotice';

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: { searchParams: { q?: string } }) {
  let coffees: Awaited<ReturnType<typeof listCoffeesWithBrewCount>> = [];
  let dbError: string | null = null;
  try {
    coffees = await listCoffeesWithBrewCount(searchParams.q);
  } catch (err: any) {
    dbError = err?.message || 'Error desconocido.';
  }
  const hasQuery = !!searchParams.q?.trim();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl text-ink">Tus cafés</h1>
        <p className="text-sm text-inkmuted mt-1">
          Guarda cada café que pruebas y lleva el historial de cómo lo preparaste.
        </p>
      </div>

      {dbError && <DatabaseErrorNotice message={dbError} />}

      {!dbError && (
        <>
          <Suspense fallback={<div className="field-input opacity-50">Cargando buscador…</div>}>
            <SearchBar />
          </Suspense>

          {coffees.length === 0 && !hasQuery && (
            <div className="card p-5 sm:p-8 text-center">
              <p className="text-ink font-display text-lg mb-1">Aún no tienes cafés guardados</p>
              <p className="text-sm text-inkmuted mb-4">
                Empieza tomando una foto del empaque de tu próximo café.
              </p>
              <Link href="/cafes/nuevo" className="btn-primary">
                Agregar tu primer café
              </Link>
            </div>
          )}

          {coffees.length === 0 && hasQuery && (
            <div className="card p-6 text-center text-sm text-inkmuted">
              No encontramos cafés que coincidan con "{searchParams.q}".
            </div>
          )}

          {coffees.length > 0 && (
            <div className="space-y-3">
              {coffees.map((c) => (
                <CoffeeCard key={c.id} coffee={c} brewCount={c.brewCount} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
