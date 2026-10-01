import Link from 'next/link';
import StandalonePourCalculator from '@/components/StandalonePourCalculator';

export default function CalculadoraPage() {
  return (
    <div className="space-y-5">
      <div>
        <Link href="/" className="text-sm text-roast-600 hover:underline">← Volver</Link>
        <h1 className="font-display text-2xl text-ink mt-2">Calculadora de vertidos</h1>
        <p className="text-sm text-inkmuted mt-1">Calcula la receta sin asociarla a un café ni guardarla.</p>
      </div>
      <StandalonePourCalculator />
    </div>
  );
}
