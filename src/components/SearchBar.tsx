'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get('q') ?? '';
  const [value, setValue] = useState(current);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // No navega si el texto ya coincide con la URL (evita un reemplazo inútil al montar).
    if (value.trim() === current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) params.set('q', value.trim());
      else params.delete('q');
      const qs = params.toString();
      router.replace(qs ? `/?${qs}` : '/');
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type="search"
      className="field-input"
      placeholder="Buscar por nombre, tostador, variedad, origen…"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      aria-label="Buscar cafés"
    />
  );
}
