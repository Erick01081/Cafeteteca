import CoffeeForm from '@/components/CoffeeForm';

export default function NuevoCafePage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl text-ink">Nuevo café</h1>
        <p className="text-sm text-inkmuted mt-1">
          Toma una foto del empaque; intentaremos leer la etiqueta para ayudarte a completar los datos.
        </p>
      </div>
      <CoffeeForm mode="create" />
    </div>
  );
}
