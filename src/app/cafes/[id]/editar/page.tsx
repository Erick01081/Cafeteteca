import { notFound } from 'next/navigation';
import { getCoffee } from '@/lib/repo';
import CoffeeForm from '@/components/CoffeeForm';

export const dynamic = 'force-dynamic';

export default async function EditarCafePage({ params }: { params: { id: string } }) {
  const coffee = await getCoffee(params.id);
  if (!coffee) notFound();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl text-ink">Editar café</h1>
        <p className="text-sm text-inkmuted mt-1">{coffee.name}</p>
      </div>
      <CoffeeForm mode="edit" coffeeId={coffee.id} initialCoffee={coffee} />
    </div>
  );
}
