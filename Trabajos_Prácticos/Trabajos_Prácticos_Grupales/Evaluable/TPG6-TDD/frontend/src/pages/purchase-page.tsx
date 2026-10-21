import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ApiError,
  createPurchase,
  getAvailableDates,
  quotePurchase,
  type PaymentMethod,
  type Quote,
  type TicketRequest,
} from '../api';
import { PaymentMethodPicker } from '../components/payment-method-picker';
import { PurchaseSummary } from '../components/purchase-summary';
import { Section } from '../components/section';
import { SiteHeader } from '../components/site-header';
import { VisitDateCalendar } from '../components/visit-date-calendar';
import { VisitorList, type Visitor } from '../components/visitor-list';
import { isValidAge } from '../helpers';

const MAX_VISITORS = 10;

let nextVisitorId = 1;
function newVisitor(): Visitor {
  return { id: nextVisitorId++, passType: 'REGULAR', age: '' };
}

export function PurchasePage() {
  const navigate = useNavigate();
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [visitDate, setVisitDate] = useState<string>();
  const [visitors, setVisitors] = useState<Visitor[]>(() => [newVisitor()]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>();
  const [quoted, setQuoted] = useState<{ key: string; quote: Quote }>();
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const agesAreValid = visitors.every((visitor) => isValidAge(visitor.age));
  const tickets: TicketRequest[] = agesAreValid
    ? visitors.map((visitor) => ({ passType: visitor.passType, visitorAge: Number(visitor.age) }))
    : [];
  const ticketsKey = JSON.stringify(tickets);
  // A quote is only shown if it matches the current visitors, so a slow response never mislabels rows.
  const quote = quoted?.key === ticketsKey ? quoted.quote : undefined;
  const canSubmit = Boolean(visitDate && paymentMethod && agesAreValid) && !submitting;

  useEffect(() => {
    async function loadDates() {
      try {
        setAvailableDates(await getAvailableDates());
      } catch {
        setError('No se pudieron cargar las fechas disponibles. Recarga la página.');
      }
    }
    void loadDates();
  }, []);

  useEffect(() => {
    if (!agesAreValid) return;
    const controller = new AbortController();

    async function loadQuote() {
      try {
        const quote = await quotePurchase(JSON.parse(ticketsKey) as TicketRequest[], controller.signal);
        setQuoted({ key: ticketsKey, quote });
      } catch {
        // Requests are aborted on purpose when the visitors change; only a real failure is reported.
        if (!controller.signal.aborted) setError('No se pudo calcular el total.');
      }
    }
    void loadQuote();
    return () => controller.abort();
  }, [ticketsKey, agesAreValid]);

  function updateVisitor(id: number, changes: Partial<Visitor>) {
    setVisitors((current) =>
      current.map((visitor) => (visitor.id === id ? { ...visitor, ...changes } : visitor)),
    );
  }

  async function confirmPurchase() {
    if (!visitDate || !paymentMethod) return;
    setSubmitting(true);
    setError(undefined);
    try {
      const result = await createPurchase({ visitDate, tickets, paymentMethod });
      void navigate(result.redirectUrl ?? `/compras/${result.purchaseId}`);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'No se pudo completar la compra. Intenta nuevamente.',
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream font-sans text-ink">
      <SiteHeader />

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pt-7 pb-12">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-bold text-forest">Comprar entradas</h1>
          <p className="text-muted">Selecciona la fecha, indica quiénes vienen y elige cómo pagar.</p>
        </div>

        <div className="flex flex-wrap items-start gap-6">
          <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
            <Section step={1} title="Fecha de visita">
              {availableDates.length > 0 ? (
                <VisitDateCalendar
                  availableDates={availableDates}
                  selected={visitDate}
                  onSelect={setVisitDate}
                />
              ) : (
                <p className="text-muted">Cargando fechas disponibles…</p>
              )}
              <p className="text-sm text-muted">
                Abrimos de martes a domingo, de 8:30 a 19:00, salvo el 25 de diciembre y el 1 de enero.
                Puedes comprar con hasta un mes de anticipación, y para el mismo día, hasta las 17:30.
              </p>
            </Section>

            <Section
              step={2}
              title="Visitantes"
              aside={
                <span className="text-sm text-muted">
                  {visitors.length} de {MAX_VISITORS} entradas
                </span>
              }
            >
              <VisitorList
                visitors={visitors}
                quote={quote}
                maxVisitors={MAX_VISITORS}
                onChange={updateVisitor}
                onAdd={() => setVisitors((current) => [...current, newVisitor()])}
                onRemove={(id) => setVisitors((current) => current.filter((visitor) => visitor.id !== id))}
              />
            </Section>

            <Section step={3} title="Forma de pago">
              <PaymentMethodPicker value={paymentMethod} onChange={setPaymentMethod} />
            </Section>
          </div>

          <PurchaseSummary
            visitDate={visitDate}
            visitors={visitors}
            quote={quote}
            paymentMethod={paymentMethod}
            error={error}
            canSubmit={canSubmit}
            submitting={submitting}
            onSubmit={() => void confirmPurchase()}
          />
        </div>
      </main>
    </div>
  );
}
