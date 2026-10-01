import Link from 'next/link';
import PourCalculator from '@/components/PourCalculator';

export default function CalculadoraPage() {
  return (
    <div className="space-y-5">
      <div>
        <Link href="/" className="text-sm text-roast-600 hover:underline">← Volver</Link>
        <h1 className="font-display text-2xl text-ink mt-2">Calculadora de vertidos</h1>
        <p className="text-sm text-inkmuted mt-1">
          Calcula la receta paso a paso. No se guarda nada en el servidor; solo recordamos tus últimos valores en este dispositivo.
        </p>
      </div>
      <PourCalculator />
    </div>
  );
}
