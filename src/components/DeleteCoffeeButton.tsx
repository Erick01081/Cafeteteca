'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ConfirmDialog from './ConfirmDialog';

export default function DeleteCoffeeButton({ coffeeId, coffeeName }: { coffeeId: string; coffeeName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/coffees/${coffeeId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      router.push('/');
      router.refresh();
    } catch {
      setDeleting(false);
      setOpen(false);
      setError('No se pudo eliminar el café. Intenta de nuevo.');
    }
  }

  return (
    <>
      <button type="button" className="btn-danger" onClick={() => setOpen(true)}>
        Eliminar café
      </button>
      {error && <p className="field-error mt-1">{error}</p>}
      <ConfirmDialog
        open={open}
        title={`¿Eliminar "${coffeeName}"?`}
        description="Se eliminarán también todas sus preparaciones guardadas. Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
        confirmLabel={deleting ? 'Eliminando…' : 'Eliminar todo'}
      />
    </>
  );
}
