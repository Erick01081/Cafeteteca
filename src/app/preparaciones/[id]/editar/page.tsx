import { notFound } from 'next/navigation';
import { getPreparation } from '@/lib/repo';
import PreparationForm from '@/components/PreparationForm';
import DatabaseErrorNotice from '@/components/DatabaseErrorNotice';

export const dynamic = 'force-dynamic';

export default async function EditPreparationPage({ params }: { params: { id: string } }) {
  let preparation;
  try {
    preparation = await getPreparation(params.id);
  } catch (err: any) {
    return <DatabaseErrorNotice message={err?.message || 'Error desconocido.'} />;
  }

  if (!preparation) notFound();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl text-ink">Modificar receta usada</h1>
        <p className="text-sm text-inkmuted mt-1">Ajusta la receta guardada y conserva su historial.</p>
      </div>
      <PreparationForm preparation={preparation} />
    </div>
  );
}
