import { randomUUID } from 'node:crypto';
import { DomainError } from '../domain/errors';
import { availableDates, validateVisitDate } from '../domain/park-calendar';
import { Purchase, Ticket, type TicketRequest } from '../domain/purchase';
import { PaymentMethod, type PurchaseStatus } from '../domain/types';
import type { Dependencies, EmailKind } from './dependencies';

const MAX_TICKETS_PER_DATE = 10;

export interface PurchaseTicketsRequest {
  visitDate: string;
  tickets: TicketRequest[];
  paymentMethod: PaymentMethod;
}

export interface PurchaseSummary {
  purchaseId: string;
  visitDate: string;
  ticketCount: number;
  total: number;
  status: PurchaseStatus;
  redirectUrl?: string;
}

export interface Quote {
  tickets: { listPrice: number; discountPercent: number; subtotal: number }[];
  total: number;
}

export async function purchaseTickets(
  userId: string,
  request: PurchaseTicketsRequest,
  deps: Dependencies,
): Promise<PurchaseSummary> {
  const user = deps.repository.findUser(userId);
  if (!user) throw new DomainError('USER_NOT_REGISTERED');

  validateVisitDate(request.visitDate, deps.clock.parkNow());

  const props = {
    id: randomUUID(),
    userId,
    visitDate: request.visitDate,
    tickets: request.tickets,
  };
  const purchase =
    request.paymentMethod === PaymentMethod.TARJETA
      ? Purchase.createForCard(props)
      : Purchase.createForCash(props, randomUUID());

  const alreadyBought = deps.repository.countActiveTickets(
    userId,
    request.visitDate,
  );
  if (alreadyBought + purchase.ticketCount() > MAX_TICKETS_PER_DATE) {
    throw new DomainError('TICKET_LIMIT_PER_DATE_EXCEEDED');
  }

  deps.repository.savePurchase(purchase);

  if (purchase.paymentMethod === PaymentMethod.TARJETA) {
    return summaryOf(purchase, deps.paymentGateway.createPayment(purchase));
  }
  await sendEmail(deps, 'CASH_RESERVATION', user.email, purchase);
  return summaryOf(purchase);
}

export async function processPaymentResult(
  purchaseId: string,
  approved: boolean,
  deps: Dependencies,
): Promise<PurchaseSummary> {
  const purchase = findPurchaseOrFail(purchaseId, deps);
  const user = deps.repository.findUser(purchase.userId);
  if (!user) throw new DomainError('USER_NOT_REGISTERED');

  if (approved) {
    purchase.confirmCardPayment(randomUUID());
  } else {
    purchase.rejectCardPayment();
  }
  deps.repository.savePurchase(purchase);

  await sendEmail(
    deps,
    approved ? 'PURCHASE_CONFIRMED' : 'PAYMENT_REJECTED',
    user.email,
    purchase,
  );
  return summaryOf(purchase);
}

export function getPurchase(
  purchaseId: string,
  deps: Dependencies,
): PurchaseSummary {
  return summaryOf(findPurchaseOrFail(purchaseId, deps));
}

export function quotePurchase(tickets: TicketRequest[]): Quote {
  const quoted = tickets.map((request) => Ticket.create(request));
  return {
    tickets: quoted.map((ticket) => ({
      listPrice: ticket.listPrice,
      discountPercent: ticket.discountPercent,
      subtotal: ticket.subtotal(),
    })),
    total: quoted.reduce((sum, ticket) => sum + ticket.subtotal(), 0),
  };
}

export function getAvailableDates(deps: Dependencies): string[] {
  return availableDates(deps.clock.parkNow());
}

function findPurchaseOrFail(purchaseId: string, deps: Dependencies): Purchase {
  const purchase = deps.repository.findPurchase(purchaseId);
  if (!purchase) throw new DomainError('PURCHASE_NOT_FOUND');
  return purchase;
}

// The email is not part of the purchase: if it fails, the purchase stays registered (RC-04).
async function sendEmail(
  deps: Dependencies,
  kind: EmailKind,
  to: string,
  purchase: Purchase,
) {
  try {
    await deps.emailSender.send({ kind, to, purchase });
  } catch (error) {
    console.error(
      `The ${kind} email for purchase ${purchase.id} could not be sent`,
      error,
    );
  }
}

function summaryOf(purchase: Purchase, redirectUrl?: string): PurchaseSummary {
  return {
    purchaseId: purchase.id,
    visitDate: purchase.visitDate,
    ticketCount: purchase.ticketCount(),
    total: purchase.total(),
    status: purchase.status,
    redirectUrl,
  };
}