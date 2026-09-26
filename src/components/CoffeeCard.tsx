import Link from 'next/link';
import { Coffee } from '@/lib/types';

export default function CoffeeCard({ coffee, brewCount }: { coffee: Coffee; brewCount: number }) {
  const originParts = [coffee.municipality, coffee.region, coffee.country].filter(Boolean);

  return (
    <Link
      href={`/cafes/${coffee.id}`}
      className="card flex gap-3 p-3 hover:border-roast-300 transition-colors"
    >
      <div className="h-20 w-20 shrink-0 rounded-md overflow-hidden bg-roast-50 border border-line">
        {coffee.photoPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/uploads/${coffee.photoPath}`}
            alt={`Empaque de ${coffee.name}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-roast-300 text-2xl">
            ☕
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base text-ink truncate">{coffee.name}</h3>
          {coffee.isSample && <span className="chip shrink-0">ejemplo</span>}
        </div>
        {coffee.roaster && <p className="text-sm text-inkmuted truncate">{coffee.roaster}</p>}
        {originParts.length > 0 && (
          <p className="text-xs text-inkmuted truncate">{originParts.join(', ')}</p>
        )}
        <p className="text-xs text-roast-600 mt-1">
          {brewCount === 0 ? 'Sin preparaciones aún' : `${brewCount} preparación${brewCount === 1 ? '' : 'es'}`}
        </p>
      </div>
    </Link>
  );
}
