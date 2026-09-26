export default function DatabaseErrorNotice({ message }: { message: string }) {
  return (
    <div className="card p-6 space-y-3 border-danger/30 bg-danger/5">
      <h2 className="font-display text-lg text-ink">No se pudo conectar con la base de datos</h2>
      <p className="text-sm text-ink">{message}</p>
      <div className="text-sm text-inkmuted space-y-1">
        <p>Revisa lo siguiente:</p>
        <ul className="list-disc pl-5 space-y-0.5">
          <li>
            Que <code className="text-xs">SUPABASE_URL</code> y{' '}
            <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code> estén configuradas (archivo{' '}
            <code className="text-xs">.env.local</code> en local, o "Environment Variables" en Vercel).
          </li>
          <li>Que hayas ejecutado el script SQL de configuración en tu proyecto de Supabase.</li>
          <li>Que el proyecto de Supabase esté activo (los proyectos gratuitos se pausan tras inactividad).</li>
        </ul>
      </div>
    </div>
  );
}
