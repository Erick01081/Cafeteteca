'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ReplicatePreparationButton({ preparationId }: { preparationId: string }) {
  const router = useRouter();
  const [replicating, setReplicating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReplicate() {
    setReplicating(true);
    setError(null);
    try {
      const res = await fetch(`/api/preparaciones/${preparationId}/replicar`, { method: 'POST' });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError('No se pudo replicar la receta. Intenta de nuevo.');
    } finally {
      setReplicating(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className="btn-secondary !py-1.5 !px-3 text-sm"
        onClick={handleReplicate}
        disabled={replicating}
      >
        {replicating ? 'Replicando…' : 'Replicar'}
      </button>
      {error && <p className="field-error mt-1" role="alert">{error}</p>}
    </div>
  );
}
