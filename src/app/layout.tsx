import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cafeteca — cuaderno de café filtrado',
  description: 'Guarda tus cafés, reconoce sus etiquetas y lleva el historial de tus preparaciones.'
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#8A4B2E'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Work+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body min-h-screen flex flex-col">
        <header className="border-b border-line bg-surface">
          <div className="mx-auto max-w-3xl px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2">
            <Link href="/" className="font-display text-xl text-roast-600 tracking-tight">
              Cafeteca
            </Link>
            <nav className="flex items-center gap-1 sm:gap-3 text-xs sm:text-sm">
              <Link href="/cafes/nuevo" className="inline-flex min-h-11 items-center rounded-md px-2 text-ink hover:text-roast-600">
                Nuevo café
              </Link>
              <Link href="/preparaciones/nueva" className="inline-flex min-h-11 items-center rounded-md px-2 text-ink hover:text-roast-600">
                Preparar
              </Link>
              <Link href="/calculadora" className="inline-flex min-h-11 items-center rounded-md px-2 text-ink hover:text-roast-600">
                Calculadora
              </Link>
              <Link href="/ajustes" className="inline-flex min-h-11 items-center rounded-md px-2 text-ink hover:text-roast-600">
                Ajustes
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-3xl px-3 sm:px-4 py-4 sm:py-6">{children}</main>
        <footer className="border-t border-line py-4">
          <div className="mx-auto max-w-3xl px-4 text-xs text-inkmuted">
            Tus datos se guardan localmente en tu propio servidor.
          </div>
        </footer>
      </body>
    </html>
  );
}
