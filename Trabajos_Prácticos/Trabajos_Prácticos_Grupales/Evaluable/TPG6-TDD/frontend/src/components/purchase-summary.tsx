import type { PaymentMethod, Quote } from '../api';
import { formatMoney, formatVisitDate } from '../helpers';
import type { Visitor } from './visitor-list';

interface PurchaseSummaryProps {
  visitDate?: string;
  visitors: Visitor[];
  quote?: Quote;
  paymentMethod?: PaymentMethod;
  error?: string;
  canSubmit: boolean;
  submitting: boolean;
  onSubmit: () => void;
}

const paymentNotes: Record<PaymentMethod, string> = {
  TARJETA: 'Al confirmar te redirigimos a Mercado Pago para completar el pago.',
  EFECTIVO: 'Pagas en boletería el día de la visita, presentando el QR que te enviamos por correo.',
};

export function PurchaseSummary({
  visitDate,
  visitors,
  quote,
  paymentMethod,
  error,
  canSubmit,
  submitting,
  onSubmit,
}: PurchaseSummaryProps) {
  return (
    <aside
      aria-labelledby="summary-title"
      className="flex min-w-0 flex-[1_1_300px] flex-col gap-3.5 rounded-2xl border border-line bg-paper p-5"
    >
      <h2 id="summary-title" className="text-xl font-bold">
        Resumen
      </h2>

      <p className="rounded-lg bg-cream p-3 font-bold">
        {visitDate ? formatVisitDate(visitDate) : 'Elige una fecha de visita'}
      </p>

      <ul className="flex flex-col gap-2.5">
        {visitors.map((visitor, index) => (
          <li key={visitor.id} className="flex justify-between gap-3">
            <span className="text-muted">
              {visitor.passType === 'VIP' ? 'VIP' : 'Regular'}
              {visitor.age !== '' && ` · ${visitor.age} años`}
            </span>
            <span>{quote ? formatMoney(quote.tickets[index].subtotal) : '—'}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-baseline justify-between border-t border-line pt-3.5">
        <span className="font-bold">Total</span>
        <span className="text-2xl font-bold text-forest">{quote ? formatMoney(quote.total) : '—'}</span>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-berry bg-berry/10 p-3 text-sm text-berry-dark">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        className="min-h-13 cursor-pointer rounded-xl bg-forest text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? 'Confirmando…' : 'Confirmar compra'}
      </button>

      <p className="text-sm text-muted">
        {paymentMethod ? paymentNotes[paymentMethod] : 'Elige una forma de pago para continuar.'}
      </p>
    </aside>
  );
}
