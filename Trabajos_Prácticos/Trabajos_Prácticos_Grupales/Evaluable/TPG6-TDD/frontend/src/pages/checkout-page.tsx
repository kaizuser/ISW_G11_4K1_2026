import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ApiError, getPurchase, sendPaymentResult } from '../api';
import { formatMoney, formatVisitDate, ticketsLabel } from '../helpers';
import { useResource } from '../use-resource';

const cardFields = [
  { id: 'card-number', label: 'Número de tarjeta', value: '4509 9535 6623 3704', inputMode: 'numeric' },
  { id: 'card-holder', label: 'Nombre del titular', value: 'ANA PEREZ', inputMode: 'text' },
  { id: 'card-expiry', label: 'Vencimiento', value: '11/30', inputMode: 'numeric' },
  { id: 'card-cvv', label: 'Código de seguridad', value: '123', inputMode: 'numeric' },
] as const;

/** Simulated Mercado Pago checkout (FAQ 4): the visitor approves or rejects the payment. */
export function CheckoutPage() {
  const { purchaseId = '' } = useParams();
  const navigate = useNavigate();
  const { data: purchase, error: loadError } = useResource(getPurchase, purchaseId);
  const [error, setError] = useState<string>();
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (purchase && purchase.status !== 'PENDIENTE_PAGO') {
      void navigate(`/compras/${purchaseId}`, { replace: true });
    }
  }, [purchase, purchaseId, navigate]);

  async function pay(approved: boolean) {
    setPaying(true);
    setError(undefined);
    try {
      await sendPaymentResult(purchaseId, approved);
      void navigate(`/compras/${purchaseId}`, { replace: true });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo procesar el pago.');
      setPaying(false);
    }
  }

  return (
    <div className="min-h-screen bg-sim-surface font-sans text-sim-ink">
      <header className="flex items-center justify-between border-b border-sim-line bg-white px-5 py-3.5">
        <span className="text-lg font-bold">Mercado Pago</span>
        <span className="rounded-full bg-sim-badge px-2.5 py-1 text-xs font-bold">Simulación</span>
      </header>

      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-6 pb-10">
        {loadError && <p role="alert">{loadError}</p>}
        {!purchase && !loadError && <p className="text-sim-muted">Cargando el pago…</p>}

        {purchase && (
          <>
            <section className="flex flex-col gap-1.5 rounded-2xl bg-white p-5 shadow-sm">
              <span className="text-sm text-sim-muted">Estás pagando a EcoHarmony Park</span>
              <span className="text-4xl font-bold">{formatMoney(purchase.total)}</span>
              <span className="text-sm text-sim-muted">
                {ticketsLabel(purchase.ticketCount)} · {formatVisitDate(purchase.visitDate)}
              </span>
            </section>

            <section
              aria-labelledby="card-title"
              className="grid grid-cols-2 gap-3.5 rounded-2xl bg-white p-5 shadow-sm"
            >
              <h1 id="card-title" className="col-span-2 text-lg font-bold">
                Pagar con tarjeta
              </h1>
              {cardFields.map((field, index) => (
                <div key={field.id} className={`flex flex-col gap-1.5 ${index < 2 ? 'col-span-2' : ''}`}>
                  <label htmlFor={field.id} className="text-sm">
                    {field.label}
                  </label>
                  <input
                    id={field.id}
                    defaultValue={field.value}
                    inputMode={field.inputMode}
                    className="min-h-12 w-full rounded-lg border border-sim-line px-3.5 text-base"
                  />
                </div>
              ))}
            </section>

            {error && (
              <p role="alert" className="rounded-xl border border-berry bg-berry/10 p-3 text-sm text-berry-dark">
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={paying}
              onClick={() => void pay(true)}
              className="min-h-13 cursor-pointer rounded-xl bg-sim-blue text-lg font-bold text-white disabled:opacity-50"
            >
              {paying ? 'Procesando…' : `Pagar ${formatMoney(purchase.total)}`}
            </button>
            <button
              type="button"
              disabled={paying}
              onClick={() => void pay(false)}
              className="min-h-12 cursor-pointer rounded-xl border border-sim-blue bg-white font-bold text-sim-blue disabled:opacity-50"
            >
              Simular pago rechazado
            </button>
            <Link
              to={`/compras/${purchaseId}`}
              className="flex min-h-11 items-center justify-center text-sim-blue underline"
            >
              Volver a EcoHarmony Park
            </Link>
            <p className="text-center text-sm text-sim-muted">Entorno de prueba. No se realizan cobros reales.</p>
          </>
        )}
      </main>
    </div>
  );
}
