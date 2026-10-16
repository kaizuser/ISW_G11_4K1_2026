import type { PaymentMethod } from '../api';

const options: { value: PaymentMethod; title: string; description: string }[] = [
  {
    value: 'TARJETA',
    title: 'Tarjeta',
    description: 'Pagas ahora con crédito o débito a través de Mercado Pago.',
  },
  {
    value: 'EFECTIVO',
    title: 'Efectivo en boletería',
    description: 'Reservas ahora y pagas el día de la visita presentando tu QR.',
  },
];

interface PaymentMethodPickerProps {
  value?: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
}

export function PaymentMethodPicker({ value, onChange }: PaymentMethodPickerProps) {
  return (
    <fieldset className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
      <legend className="sr-only">Forma de pago</legend>
      {options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-white p-4 has-checked:border-2 has-checked:border-forest has-checked:bg-lime/15"
        >
          <input
            type="radio"
            name="payment-method"
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="mt-0.5 size-5 accent-forest"
          />
          <span className="flex flex-col gap-1">
            <span className="font-bold">{option.title}</span>
            <span className="text-sm text-muted">{option.description}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
