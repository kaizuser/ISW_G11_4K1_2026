import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { PassType } from '../domain/types';
import type { PurchaseEmailView } from '../services/purchase-service';

const FOREST = '#386641';
const INK = '#1E2B20';
const MUTED = '#4F5B50';

const PAYMENT_LABELS = {
  EFECTIVO: 'Efectivo en boletería',
  TARJETA: 'Tarjeta',
};
const STATUS_LABELS = {
  PENDIENTE_PAGO: 'Pendiente de pago',
  CONFIRMADA: 'Confirmada',
  CONFIRMADA_PAGO_EN_BOLETERIA: 'Pago en boletería',
  RECHAZADA: 'Rechazada',
};

function money(pesos: number): string {
  return `$ ${pesos.toLocaleString('es-AR')}`;
}

function dayMonthYear(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

export function qrDataUrl(accessCode: string): Promise<string> {
  return QRCode.toDataURL(accessCode, { margin: 1, width: 240 });
}

/** The receipt attached to the email (FAQ 5), with the same data and QR as the email body. */
export async function receiptPdf(email: PurchaseEmailView): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 56 });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const finished = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  doc.fillColor(FOREST).fontSize(24).text('EcoHarmony Park');
  doc.fillColor(MUTED).fontSize(12).text('Comprobante de compra').moveDown(1.5);

  doc.fillColor(INK).fontSize(12);
  doc.text(`N.º de orden: ${email.orderNumber}`);
  doc.text(`Fecha de visita: ${dayMonthYear(email.visitDate)}`);
  doc.text(`Forma de pago: ${PAYMENT_LABELS[email.paymentMethod]}`);
  doc.text(`Estado: ${STATUS_LABELS[email.status]}`).moveDown();

  email.tickets.forEach((ticket, index) => {
    const pass = ticket.passType === PassType.VIP ? 'VIP' : 'Regular';
    const discount =
      ticket.discountPercent > 0
        ? ` (${ticket.discountPercent}% de descuento)`
        : '';
    doc.text(
      `${index + 1}. ${pass} · ${ticket.visitorAge} años${discount}: ${money(ticket.subtotal)}`,
    );
  });
  doc
    .moveDown()
    .fontSize(14)
    .fillColor(FOREST)
    .text(`Total: ${money(email.total)}`);

  if (email.accessCode) {
    const qr = await QRCode.toBuffer(email.accessCode, {
      margin: 1,
      width: 180,
    });
    doc.moveDown().image(qr, { width: 160 });
    doc
      .fillColor(MUTED)
      .fontSize(10)
      .text('Presenta este código QR en el ingreso del parque.');
  }

  doc.end();
  return finished;
}
