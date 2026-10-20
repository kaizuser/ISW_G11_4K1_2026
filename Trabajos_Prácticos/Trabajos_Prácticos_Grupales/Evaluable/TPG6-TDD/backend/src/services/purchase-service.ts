import { randomUUID } from 'node:crypto';
import { Purchase, type TicketRequest } from '../domain/purchase';
import type { PaymentMethod } from '../domain/types';
import type { Dependencies } from './dependencies';

export interface PurchaseTicketsRequest {
  visitDate: string;
  tickets: TicketRequest[];
  paymentMethod: PaymentMethod;
}

export function purchaseTickets(
  userId: string,
  request: PurchaseTicketsRequest,
  deps: Dependencies,
) {
  const purchase = Purchase.createForCard({
    id: randomUUID(),
    userId,
    visitDate: request.visitDate,
    tickets: request.tickets,
  });
  deps.repository.savePurchase(purchase);

  return Promise.resolve({
    purchaseId: purchase.id,
    status: purchase.status,
    redirectUrl: deps.paymentGateway.createPayment(purchase),
  });
}