import Link from 'next/link';
import { Suspense } from 'react';
import { listCoffees } from '@/lib/repo';
import CoffeeCard from '@/components/CoffeeCard';
import SearchBar from '@/components/SearchBar';
import DatabaseErrorNotice from '@/components/DatabaseErrorNotice';

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: { searchParams: { q?: string } }) {
  let coffees: Awaited<ReturnType<typeof listCoffees>> = [];
  let dbError: string | null = null;
  try {
    coffees = await listCoffees(searchParams.q);
  } catch (err: any) {
    dbError = err?.message || 'Error desconocido.';
  }
  const hasQuery = !!searchParams.q?.trim();

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl text-ink">Tus cafés</h1>
          <p className="text-sm text-inkmuted mt-1">Guarda cada café que pruebas, con foto y datos de origen.</p>
        </div>
        <Link href="/cafes/nuevo" className="btn-primary">
          + Nuevo café
        </Link>
      </div>

      {dbError && <DatabaseErrorNotice message={dbError} />}

      {!dbError && (
        <>
          <Link
            href="/calculadora"
            className="card flex items-center justify-between gap-3 p-3 hover:border-roast-300 transition-colors"
          >
            <span>
              <span className="block font-display text-base text-ink">Calculadora de vertidos</span>
              <span className="block text-xs text-inkmuted">Dosis, ratio y bloom → pesos para la báscula.</span>
            </span>
            <span aria-hidden className="text-roast-600">→</span>
          </Link>

          {(coffees.length > 0 || hasQuery) && (
            <Suspense fallback={<div className="field-input opacity-50">Cargando buscador…</div>}>
              <SearchBar />
            </Suspense>
          )}

          {coffees.length === 0 && !hasQuery && (
            <div className="card p-5 sm:p-8 text-center">
              <p className="text-ink font-display text-lg mb-1">Aún no tienes cafés guardados</p>
              <p className="text-sm text-inkmuted mb-4">Empieza tomando una foto del empaque de tu próximo café.</p>
              <Link href="/cafes/nuevo" className="btn-primary">
                Agregar tu primer café
              </Link>
            </div>
          )}

          {coffees.length === 0 && hasQuery && (
            <div className="card p-6 text-center text-sm text-inkmuted">
              No encontramos cafés que coincidan con "{searchParams.q}".{' '}
              <Link href="/" className="text-roast-600 underline">
                Limpiar búsqueda
              </Link>
            </div>
          )}

          {coffees.length > 0 && (
            <ul className="space-y-3">
              {coffees.map((c) => (
                <li key={c.id}>
                  <CoffeeCard coffee={c} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
