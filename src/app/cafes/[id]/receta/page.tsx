import Link from 'next/link';
import { notFound } from 'next/navigation';
import CreatePreparationForm from '@/components/CreatePreparationForm';
import DatabaseErrorNotice from '@/components/DatabaseErrorNotice';
import { getCoffee } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export default async function CreateCoffeeRecipePage({ params }: { params: { id: string } }) {
  let coffee;
  try {
    coffee = await getCoffee(params.id);
  } catch (error: any) {
    return <DatabaseErrorNotice message={error?.message || 'Error desconocido.'} />;
  }
  if (!coffee) notFound();

  return (
    <div className="space-y-5">
      <Link href={`/cafes/${coffee.id}`} className="text-sm text-roast-600 hover:underline">
        ← Volver a {coffee.name}
      </Link>
      <div>
        <h1 className="font-display text-2xl text-ink">Crear receta</h1>
        <p className="text-sm text-inkmuted mt-1">Calcula los vertidos y registra cómo quedó la preparación de {coffee.name}.</p>
      </div>
      <CreatePreparationForm coffeeId={coffee.id} />
    </div>
  );
}
