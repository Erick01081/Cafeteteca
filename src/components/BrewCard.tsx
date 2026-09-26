'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from './ConfirmDialog';
import { Brew } from '@/lib/types';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatTime(totalTimeSec: number | null) {
  if (totalTimeSec == null) return null;
  const m = Math.floor(totalTimeSec / 60);
  const s = totalTimeSec % 60;
  return `${m}:${String(s).padStart(2, '0')} min`;
}

export default function BrewCard({ brew, coffeeId }: { brew: Brew; coffeeId: string }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const dripperLabel = brew.dripper === 'Otro' ? brew.dripperOther || 'Otro' : brew.dripper;
  const time = formatTime(brew.totalTimeSec);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/brews/${brew.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setDeleting(false);
      setConfirmOpen(false);
      alert('No se pudo eliminar la preparación. Intenta de nuevo.');
    }
  }

  const notes = [
    brew.notesFlavor && ['Sabor', brew.notesFlavor],
    brew.notesAroma && ['Aroma', brew.notesAroma],
    brew.notesBody && ['Cuerpo', brew.notesBody],
    brew.notesExtraction && ['Extracción', brew.notesExtraction],
    brew.notesChange && ['Cambiaría', brew.notesChange],
    brew.notesOther && ['Otras notas', brew.notesOther]
  ].filter(Boolean) as [string, string][];

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm text-inkmuted">{formatDate(brew.brewedAt)}</p>
          <p className="font-display text-base text-ink mt-0.5">
            {dripperLabel} · {brew.doseGrams} g · 1:{brew.ratio} · bloom {brew.bloomRatio}
          </p>
          <p className="text-sm text-inkmuted">
            {brew.totalWaterG} g de agua · {brew.pourCount} vertido{brew.pourCount === 1 ? '' : 's'}
            {brew.waterTempC != null ? ` · ${brew.waterTempC} °C` : ''}
            {time ? ` · ${time}` : ''}
          </p>
          <p className="text-sm text-inkmuted">Molienda: {brew.grindText}</p>
        </div>
        {brew.isSample && <span className="chip">ejemplo</span>}
      </div>

      {notes.length > 0 && (
        <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {notes.map(([label, value]) => (
            <div key={label} className="flex gap-1">
              <dt className="text-inkmuted shrink-0">{label}:</dt>
              <dd className="text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/cafes/${coffeeId}/preparar?desde=${brew.id}`}
          className="btn-secondary !py-1.5 !px-3 text-sm"
        >
          Repetir / modificar
        </Link>
        <Link
          href={`/preparaciones/${brew.id}/editar`}
          className="btn-secondary !py-1.5 !px-3 text-sm"
        >
          Editar
        </Link>
        <button
          type="button"
          className="btn-danger !py-1.5 !px-3 text-sm"
          onClick={() => setConfirmOpen(true)}
        >
          Eliminar
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="¿Eliminar esta preparación?"
        description="Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
        confirmLabel={deleting ? 'Eliminando…' : 'Eliminar'}
      />
    </div>
  );
}
