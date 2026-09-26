'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AjustesPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [addingSample, setAddingSample] = useState(false);
  const [removingSample, setRemovingSample] = useState(false);

  async function handleImportFile(file: File | undefined) {
    if (!file) return;
    setImporting(true);
    setMessage(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo importar el archivo.');
      setMessage({
        type: 'ok',
        text: `Importado: ${data.result.coffees} cafés y ${data.result.brews} preparaciones.`
      });
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
      if (data.alreadyExisted) {
        setMessage({ type: 'ok', text: 'Ya tenías datos de ejemplo cargados.' });
      } else {
        setMessage({ type: 'ok', text: 'Se agregó un café de ejemplo con una preparación.' });
      }
      router.refresh();
    } catch {
      setMessage({ type: 'error', text: 'No se pudieron crear los datos de ejemplo.' });
    } finally {
      setAddingSample(false);
    }
  }

  async function handleRemoveSample() {
    setRemovingSample(true);
    setMessage(null);
    try {
      const res = await fetch('/api/sample-data', { method: 'DELETE' });
      const data = await res.json();
      setMessage({
        type: 'ok',
        text: `Eliminados ${data.result.coffees} cafés y ${data.result.brews} preparaciones de ejemplo.`
      });
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
        <p className="text-sm text-inkmuted mt-1">Respalda tu historial o prueba la app con datos de ejemplo.</p>
      </div>

      {message && (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            message.type === 'ok'
              ? 'bg-cherry-400/10 border-cherry-400/30 text-cherry-600'
              : 'bg-danger/10 border-danger/30 text-danger'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="card p-4 space-y-3">
        <h2 className="font-display text-lg text-ink">Exportar / importar</h2>
        <p className="text-sm text-inkmuted">
          La exportación incluye tus cafés y preparaciones en un archivo JSON. Las fotos se guardan
          por separado en la carpeta <code className="text-xs">data/uploads</code> de tu servidor;
          respáldala también si quieres conservarlas.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="/api/export" className="btn-primary" download>
            Exportar todo (JSON)
          </a>
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
        <p className="field-hint">
          Importar es seguro de repetir: los registros con el mismo id se actualizan en vez de duplicarse.
        </p>
      </div>

      <div className="card p-4 space-y-3">
        <h2 className="font-display text-lg text-ink">Datos de ejemplo</h2>
        <p className="text-sm text-inkmuted">
          Si quieres ver cómo luce la app con contenido, puedes agregar un café de ejemplo claramente
          marcado como tal (nunca se mezcla con tus datos reales) y eliminarlo cuando quieras.
        </p>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-secondary" onClick={handleAddSample} disabled={addingSample}>
            {addingSample ? 'Agregando…' : 'Agregar café de ejemplo'}
          </button>
          <button type="button" className="btn-danger" onClick={handleRemoveSample} disabled={removingSample}>
            {removingSample ? 'Eliminando…' : 'Eliminar datos de ejemplo'}
          </button>
        </div>
      </div>
    </div>
  );
}
