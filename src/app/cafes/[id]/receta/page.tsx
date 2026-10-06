import Link from 'next/link';
import { notFound } from 'next/navigation';
import CreatePreparationForm from '@/components/CreatePreparationForm';
import DatabaseErrorNotice from '@/components/DatabaseErrorNotice';
import { getCoffee, getPreparation } from '@/lib/repo';
import { Preparation } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function CreateCoffeeRecipePage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: { replicar?: string | string[] };
}) {
  const replicateId = typeof searchParams?.replicar === 'string' ? searchParams.replicar : null;
  let coffee;
  let sourcePreparation: Preparation | null = null;
  try {
    coffee = await getCoffee(params.id);
    if (coffee && replicateId) {
      sourcePreparation = await getPreparation(replicateId);
    }
  } catch (error: any) {
    return <DatabaseErrorNotice message={error?.message || 'Error desconocido.'} />;
  }
  if (!coffee) notFound();
  if (replicateId && sourcePreparation?.coffeeId !== coffee.id) notFound();

  return (
    <div className="space-y-5">
      <Link href={`/cafes/${coffee.id}`} className="text-sm text-roast-600 hover:underline">
        ← Volver a {coffee.name}
      </Link>
      <div>
        <h1 className="font-display text-2xl text-ink">{sourcePreparation ? 'Replicar receta' : 'Crear receta'}</h1>
        <p className="text-sm text-inkmuted mt-1">
          {sourcePreparation
            ? `Se cargaron los parámetros de preparación de ${coffee.name}. Las notas de cata empiezan vacías.`
            : `Calcula los vertidos y registra cómo quedó la preparación de ${coffee.name}.`}
        </p>
      </div>
      <CreatePreparationForm coffeeId={coffee.id} initialPreparation={sourcePreparation} />
    </div>
  );
}
