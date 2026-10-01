'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function AjustesPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [addingSample, setAddingSample] = useState(false);
  const [removingSample, setRemovingSample] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  async function handleImportFile(file: File | undefined) {
    if (!file) return;
    setImporting(true);
    setMessage(null);
    try {
      const json = JSON.parse(await file.text());
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo importar el archivo.');
      setMessage({ type: 'ok', text: `Importados ${data.result.coffees} cafés.` });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'El archivo no es un JSON válido de Cafeteca.' });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleAddSample() {
    setAddingSample(true);
    setMessage(null);
    try {
      const res = await fetch('/api/sample-data', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setMessage({
        type: 'ok',
        text: data.alreadyExisted ? 'Ya tenías un café de ejemplo cargado.' : 'Se agregó un café de ejemplo.'
      });
      router.refresh();
    } catch {
      setMessage({ type: 'error', text: 'No se pudo crear el café de ejemplo.' });
    } finally {
      setAddingSample(false);
    }
  }

  async function handleRemoveSample() {
    setConfirmRemove(false);
    setRemovingSample(true);
    setMessage(null);
    try {
      const res = await fetch('/api/sample-data', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setMessage({ type: 'ok', text: `Eliminados ${data.result.coffees} cafés de ejemplo.` });
      router.refresh();
    } catch {
      setMessage({ type: 'error', text: 'No se pudieron eliminar los datos de ejemplo.' });
    } finally {
      setRemovingSample(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-ink">Ajustes</h1>
        <p className="text-sm text-inkmuted mt-1">Respalda tu catálogo o prueba la app con datos de ejemplo.</p>
      </div>

      {message && (
        <div
          role={message.type === 'error' ? 'alert' : 'status'}
          className={`rounded-md border px-3 py-2 text-sm ${
            message.type === 'ok'
              ? 'bg-cherry-400/10 border-cherry-400/30 text-cherry-600'
              : 'bg-danger/10 border-danger/30 text-danger'
          }`}
        >
          {message.text}
        </div>
      )}

      <section className="card p-4 space-y-3" aria-labelledby="exp">
        <h2 id="exp" className="font-display text-lg text-ink">Exportar / importar</h2>
        <p className="text-sm text-inkmuted">
          La exportación incluye tus cafés en un archivo JSON. Las fotos se guardan por separado en el
          bucket <code className="text-xs">cafeteca-fotos</code> de Supabase Storage; respáldalas desde allí si quieres conservarlas.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="/api/export" className="btn-primary" download>Exportar todo (JSON)</a>
          <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()} disabled={importing}>
            {importing ? 'Importando…' : 'Importar desde JSON'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => handleImportFile(e.target.files?.[0])}
          />
        </div>
        <p className="field-hint">Importar es seguro de repetir: los registros con el mismo id se actualizan en vez de duplicarse.</p>
      </section>

      <section className="card p-4 space-y-3" aria-labelledby="ej">
        <h2 id="ej" className="font-display text-lg text-ink">Datos de ejemplo</h2>
        <p className="text-sm text-inkmuted">
          Agrega un café de ejemplo, claramente marcado, para ver cómo luce la app. Puedes eliminarlo cuando quieras sin tocar tus datos reales.
        </p>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-secondary" onClick={handleAddSample} disabled={addingSample}>
            {addingSample ? 'Agregando…' : 'Agregar café de ejemplo'}
          </button>
          <button type="button" className="btn-danger" onClick={() => setConfirmRemove(true)} disabled={removingSample}>
            {removingSample ? 'Eliminando…' : 'Eliminar datos de ejemplo'}
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmRemove}
        title="¿Eliminar los datos de ejemplo?"
        description="Solo se borran los cafés marcados como ejemplo. Tus cafés reales no se tocan."
        onConfirm={handleRemoveSample}
        onCancel={() => setConfirmRemove(false)}
      />
    </div>
  );
}
