import { Link, useParams } from 'react-router';
import { getPurchaseEmail, type PurchaseEmail } from '../api';
import { formatMoney, formatVisitDate } from '../helpers';
import { useResource } from '../use-resource';

/** Simulated email client (FAQ 5): shows the email the backend "sent" for the purchase. */
export function EmailPage() {
  const { purchaseId = '' } = useParams();
  const { data: email, error } = useResource(getPurchaseEmail, purchaseId);

  return (
    <div className="min-h-screen bg-sim-surface font-sans text-sim-ink">
      <header className="flex items-center justify-between border-b border-sim-line bg-white px-3 py-1.5">
        <Link to={`/compras/${purchaseId}`} className="flex min-h-11 items-center gap-1.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Volver a la compra
        </Link>
        <span className="rounded-full bg-sim-badge px-2.5 py-1 text-xs font-bold">Correo simulado</span>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-3.5 px-3 pt-4 pb-10">
        {error && <p role="alert">{error}</p>}
        {!email && !error && <p className="text-sim-muted">Cargando el correo…</p>}
        {email && <EmailView email={email} />}
      </main>
    </div>
  );
}

function EmailView({ email }: { email: PurchaseEmail }) {
  return (
    <>
      <div className="flex flex-col gap-3 px-1">
        <h1 className="text-xl font-bold">{email.subject}</h1>
        <div className="flex items-center gap-2.5">
          <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-forest text-sm font-bold text-white">
            EH
          </span>
          <div className="flex flex-col">
            <span className="font-bold">EcoHarmony Park</span>
            <span className="text-sm text-sim-muted">para {email.to}</span>
          </div>
        </div>
      </div>

      <article className="overflow-hidden rounded-2xl border border-sim-line bg-white">
        <div className="bg-forest px-5 py-4 text-lg font-bold text-white">EcoHarmony Park</div>
        <div className="flex flex-col gap-4 p-5 text-ink">
          <p>Hola:</p>
          <p>{email.intro}</p>

          {email.qrCode && (
            <div className="flex flex-col items-center gap-2 rounded-xl bg-cream p-4">
              <img
                src={email.qrCode}
                alt={`Código QR de acceso de la orden ${email.orderNumber}`}
                className="size-44 rounded-lg bg-white p-2"
              />
              <span className="text-sm text-muted">Orden {email.orderNumber}</span>
            </div>
          )}

          <div className="rounded-xl border border-line px-4">
            <Row label="Fecha de visita" value={formatVisitDate(email.visitDate)} bold />
            <Row
              label="Forma de pago"
              value={email.paymentMethod === 'TARJETA' ? 'Tarjeta' : 'Efectivo en boletería'}
              bold
            />
            {email.tickets.map((ticket, index) => (
              <Row
                key={index}
                label={`${ticket.passType === 'VIP' ? 'VIP' : 'Regular'} · ${ticket.visitorAge} años${ticket.discountPercent > 0 ? ` (${ticket.discountPercent === 100 ? 'gratis' : `${ticket.discountPercent}%`})` : ''}`}
                value={formatMoney(ticket.subtotal)}
              />
            ))}
            <div className="flex justify-between py-3 font-bold">
              <span>Total</span>
              <span className="text-forest">{formatMoney(email.total)}</span>
            </div>
          </div>
        </div>
      </article>

      {email.attachmentUrl && email.attachmentName && (
        <section aria-labelledby="attachments" className="flex flex-col gap-2 px-1">
          <h2 id="attachments" className="text-sm font-bold text-sim-muted">
            1 archivo adjunto
          </h2>
          <a
            href={email.attachmentUrl}
            download={email.attachmentName}
            className="flex min-h-14 items-center gap-3 rounded-xl border border-sim-line bg-white p-2.5 pl-3.5"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-berry/15 text-xs font-bold text-berry-dark">
              PDF
            </span>
            <span className="min-w-0 flex-1 truncate">{email.attachmentName}</span>
            <span className="text-sm font-bold text-sim-blue">Descargar</span>
          </a>
        </section>
      )}
    </>
  );
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-3 border-b border-line py-3">
      <span className={bold ? 'text-muted' : ''}>{label}</span>
      <span className={bold ? 'font-bold' : ''}>{value}</span>
    </div>
  );
}
