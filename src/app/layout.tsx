import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';
import NavLinks from '@/components/NavLinks';

export const metadata: Metadata = {
  title: 'Cafeteca — cuaderno de café filtrado',
  description: 'Guarda tus cafés, reconoce sus etiquetas y calcula tus vertidos.'
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
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
        >
          Saltar al contenido
        </a>
        <header className="border-b border-line bg-surface sticky top-0 z-40">
          <div className="mx-auto max-w-3xl px-3 sm:px-4 py-1 sm:py-2 flex items-center justify-between gap-2">
            <Link href="/" className="font-display text-xl text-roast-600 tracking-tight">
              Cafeteca
            </Link>
            <NavLinks />
          </div>
        </header>
        <main id="contenido" className="flex-1 mx-auto w-full max-w-3xl px-3 sm:px-4 py-4 sm:py-6">
          {children}
        </main>
        <footer className="border-t border-line py-4">
          <div className="mx-auto max-w-3xl px-4 text-xs text-inkmuted">
            Tus datos se guardan en tu proyecto de Supabase.
          </div>
        </footer>
      </body>
    </html>
  );
}
