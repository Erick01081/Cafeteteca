'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ConfirmDialog from './ConfirmDialog';

export default function DeletePreparationButton({ preparationId }: { preparationId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/preparaciones/${preparationId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setOpen(false);
      router.refresh();
    } catch {
      setDeleting(false);
      setOpen(false);
      setError('No se pudo eliminar la receta. Intenta de nuevo.');
    }
  }

  return (
    <>
      <button type="button" className="btn-danger !py-1.5 !px-3 text-sm" onClick={() => setOpen(true)}>
        Eliminar
      </button>
      {error && <p className="field-error mt-1" role="alert">{error}</p>}
      <ConfirmDialog
        open={open}
        title="¿Eliminar esta receta?"
        description="Esta receta desaparecerá de tu historial. Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
        confirmLabel={deleting ? 'Eliminando…' : 'Eliminar'}
      />
    </>
  );
}
