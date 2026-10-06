'use client';

import Link from 'next/link';

export default function ReplicatePreparationButton({ preparationId, coffeeId }: { preparationId: string; coffeeId: string }) {
  return (
    <Link
      href={`/cafes/${coffeeId}/receta?replicar=${preparationId}`}
      className="btn-secondary !py-1.5 !px-3 text-sm"
    >
      Replicar
    </Link>
  );
}
