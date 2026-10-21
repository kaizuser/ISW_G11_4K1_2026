import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { getPurchase, type PurchaseResult, type PurchaseStatus } from '../api';
import { SiteHeader } from '../components/site-header';
import { formatMoney, formatVisitDate, ticketsLabel } from '../helpers';
import { useResource } from '../use-resource';

interface StatusContent {
  title: string;
  message: (purchase: PurchaseResult) => ReactNode;
  note: (purchase: PurchaseResult) => string;
  badge: string;
  isError: boolean;
}

const contentByStatus: Record<PurchaseStatus, StatusContent> = {
  CONFIRMADA: {
    title: '¡Compra confirmada!',
    message: (p) => `Compraste ${ticketsLabel(p.ticketCount)} para el ${formatVisitDate(p.visitDate).toLowerCase()}.`,
    note: () => 'Te enviamos la confirmación con tu QR de acceso y el comprobante por correo.',
    badge: 'Confirmada',
    isError: false,
  },
  CONFIRMADA_PAGO_EN_BOLETERIA: {
    title: 'Compra registrada',
    message: (p) => `Reservaste ${ticketsLabel(p.ticketCount)} para el ${formatVisitDate(p.visitDate).toLowerCase()}.`,
    note: (p) =>
      `Paga ${formatMoney(p.total)} en boletería el día de tu visita, presentando el QR que te enviamos por correo.`,
    badge: 'Pago en boletería',
    isError: false,
  },
  RECHAZADA: {
    title: 'Pago rechazado',
    message: (p) =>
      `No pudimos procesar el pago de ${ticketsLabel(p.ticketCount)} para el ${formatVisitDate(p.visitDate).toLowerCase()}. Las entradas quedaron liberadas.`,
    note: () => 'Te enviamos un aviso por correo.',
    badge: 'Rechazada',
    isError: true,
  },
  PENDIENTE_PAGO: {
    title: 'Pago pendiente',
    message: (p) => `Tu compra de ${ticketsLabel(p.ticketCount)} está esperando el pago.`,
    note: () => 'Completa el pago con tarjeta para confirmarla.',
    badge: 'Pendiente de pago',
    isError: false,
  },
};

const primaryLink = 'flex min-h-13 items-center justify-center rounded-xl bg-forest text-lg font-bold text-white';
const secondaryLink =
  'flex min-h-12 items-center justify-center rounded-xl border-[1.5px] border-forest font-bold text-forest';

export function ResultPage() {
  const { purchaseId = '' } = useParams();
  const { data: purchase, error } = useResource(getPurchase, purchaseId);

  return (
    <div className="min-h-screen bg-cream font-sans text-ink">
      <SiteHeader />
      <main className="mx-auto flex max-w-xl flex-col gap-5 px-4 pt-8 pb-10">
        {error && <p role="alert">{error}</p>}
        {!purchase && !error && <p className="text-muted">Cargando la compra…</p>}
        {purchase && <PurchaseResultView purchase={purchase} />}
      </main>
    </div>
  );
}

function PurchaseResultView({ purchase }: { purchase: PurchaseResult }) {
  const content = contentByStatus[purchase.status];
  const isPending = purchase.status === 'PENDIENTE_PAGO';
  const paymentLabel =
    purchase.status === 'CONFIRMADA_PAGO_EN_BOLETERIA' ? 'Efectivo en boletería' : 'Tarjeta';
  const details = [
    { label: 'Fecha de visita', value: formatVisitDate(purchase.visitDate) },
    { label: 'Entradas', value: String(purchase.ticketCount) },
    { label: 'Total', value: formatMoney(purchase.total) },
    { label: 'Forma de pago', value: paymentLabel },
  ];

  return (
    <>
      <div className="flex flex-col items-center gap-3 text-center">
        <span
          aria-hidden="true"
          className={`flex size-18 items-center justify-center rounded-full ${content.isError ? 'bg-berry/15 text-berry-dark' : 'bg-lime/40 text-forest'}`}
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            {content.isError ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M5 12.5l4.5 4.5L19 7.5" />}
          </svg>
        </span>
        <h1 className={`text-3xl font-bold ${content.isError ? 'text-berry-dark' : 'text-forest'}`}>{content.title}</h1>
        <p className="text-lg">{content.message(purchase)}</p>
      </div>

      <dl className="rounded-2xl border border-line bg-paper px-5">
        {details.map((detail) => (
          <div key={detail.label} className="flex justify-between gap-3 border-b border-line py-3.5">
            <dt className="text-muted">{detail.label}</dt>
            <dd className="font-bold">{detail.value}</dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 py-3.5">
          <dt className="text-muted">Estado</dt>
          <dd className={`rounded-full px-2.5 py-1 text-sm font-bold ${content.isError ? 'bg-berry/15 text-berry-dark' : 'bg-lime'}`}>
            {content.badge}
          </dd>
        </div>
      </dl>

      <p>{content.note(purchase)}</p>

      {isPending ? (
        <Link to={`/mercado-pago/${purchase.purchaseId}`} className={primaryLink}>
          Continuar con el pago
        </Link>
      ) : (
        <>
          <Link to={`/compras/${purchase.purchaseId}/correo`} className={primaryLink}>
            {content.isError ? 'Ver aviso enviado' : 'Ver correo enviado'}
          </Link>
          <Link to="/" className={secondaryLink}>
            {content.isError ? 'Intentar de nuevo' : 'Comprar más entradas'}
          </Link>
        </>
      )}
    </>
  );
}
