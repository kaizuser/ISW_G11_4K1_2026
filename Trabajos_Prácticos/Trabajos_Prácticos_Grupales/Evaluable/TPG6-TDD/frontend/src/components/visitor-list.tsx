import type { PassType, Quote } from '../api';
import { formatMoney, isValidAge } from '../helpers';

export interface Visitor {
  id: number;
  passType: PassType;
  age: string;
}

interface VisitorListProps {
  visitors: Visitor[];
  quote?: Quote;
  maxVisitors: number;
  onChange: (id: number, changes: Partial<Visitor>) => void;
  onAdd: () => void;
  onRemove: (id: number) => void;
}

export function VisitorList({ visitors, quote, maxVisitors, onChange, onAdd, onRemove }: VisitorListProps) {
  return (
    <div className="flex flex-col gap-3">
      {visitors.map((visitor, index) => (
        <VisitorRow
          key={visitor.id}
          number={index + 1}
          visitor={visitor}
          price={quote?.tickets[index]}
          canRemove={visitors.length > 1}
          onChange={(changes) => onChange(visitor.id, changes)}
          onRemove={() => onRemove(visitor.id)}
        />
      ))}

      <button
        type="button"
        onClick={onAdd}
        disabled={visitors.length >= maxVisitors}
        className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-leaf font-bold text-forest disabled:cursor-not-allowed disabled:opacity-50"
      >
        Agregar visitante
      </button>
      <p className="text-sm text-muted">
        Hasta 3 años no pagan. De 4 a 15 años y desde los 60, 50% de descuento.
      </p>
    </div>
  );
}

interface VisitorRowProps {
  number: number;
  visitor: Visitor;
  price?: Quote['tickets'][number];
  canRemove: boolean;
  onChange: (changes: Partial<Visitor>) => void;
  onRemove: () => void;
}

function VisitorRow({ number, visitor, price, canRemove, onChange, onRemove }: VisitorRowProps) {
  const ageId = `visitor-age-${visitor.id}`;
  const showAgeError = visitor.age !== '' && !isValidAge(visitor.age);
  const passTypes: { value: PassType; label: string }[] = [
    { value: 'REGULAR', label: 'Regular' },
    { value: 'VIP', label: 'VIP' },
  ];

  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-3 rounded-xl border border-line bg-white p-3.5">
      <div className="flex min-w-0 flex-[1_1_120px] flex-col gap-1.5">
        <span className="font-bold">Visitante {number}</span>
        {price && price.discountPercent > 0 && (
          <span className="self-start rounded-full bg-lime px-2 py-0.5 text-xs font-bold">
            {price.discountPercent === 100 ? 'Gratis' : `${price.discountPercent}% de descuento`}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">Tipo de pase</span>
        <div className="flex overflow-hidden rounded-lg border border-forest">
          {passTypes.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={visitor.passType === value}
              onClick={() => onChange({ passType: value })}
              className="min-h-11 cursor-pointer px-4 text-forest aria-pressed:bg-forest aria-pressed:font-bold aria-pressed:text-white"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={ageId} className="text-sm text-muted">
          Edad
        </label>
        <input
          id={ageId}
          type="number"
          min={0}
          inputMode="numeric"
          value={visitor.age}
          onChange={(event) => onChange({ age: event.target.value })}
          aria-invalid={showAgeError}
          className="min-h-11 w-20 rounded-lg border border-line px-3 text-base aria-invalid:border-berry-dark"
        />
      </div>

      <div className="flex min-h-11 flex-[1_1_96px] flex-col items-end justify-end">
        {price && price.discountPercent > 0 && (
          <span className="text-sm text-muted line-through">{formatMoney(price.listPrice)}</span>
        )}
        <span className="text-lg font-bold">{price ? formatMoney(price.subtotal) : '—'}</span>
      </div>

      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        aria-label={`Quitar visitante ${number}`}
        className="flex size-11 cursor-pointer items-center justify-center rounded-lg border border-line text-berry-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M6 6l1 14h10l1-14" />
        </svg>
      </button>

      {showAgeError && (
        <p className="w-full text-sm text-berry-dark">Ingresa la edad como un número entero desde 0.</p>
      )}
    </div>
  );
}
