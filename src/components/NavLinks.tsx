'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Cafés' },
  { href: '/cafes/nuevo', label: 'Nuevo café' },
  { href: '/calculadora', label: 'Calculadora' },
  { href: '/ajustes', label: 'Ajustes' }
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="flex items-center gap-0.5 sm:gap-2 text-xs sm:text-sm">
      {LINKS.map(({ href, label }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`inline-flex min-h-11 items-center rounded-md px-2 transition-colors ${
              active ? 'text-roast-600 font-semibold bg-roast-50' : 'text-ink hover:text-roast-600'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
