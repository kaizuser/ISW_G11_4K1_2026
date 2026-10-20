import type { Purchase } from '../domain/purchase';
import type { ParkNow, User } from '../domain/types';

export interface Clock {
  parkNow(): ParkNow;
}

export interface Repository {
  findUser(id: string): User | undefined;
  savePurchase(purchase: Purchase): void;
  findPurchase(id: string): Purchase | undefined;
  countActiveTickets(userId: string, visitDate: string): number;
}

export interface PaymentGateway {
  /** Returns the URL where the visitor completes the payment. */
  createPayment(purchase: Purchase): string;
}

export type EmailKind =
  'CASH_RESERVATION' | 'PURCHASE_CONFIRMED' | 'PAYMENT_REJECTED';

export interface PurchaseEmail {
  kind: EmailKind;
  to: string;
  purchase: Purchase;
}

export interface EmailSender {
  send(email: PurchaseEmail): Promise<void>;
}

export interface Dependencies {
  clock: Clock;
  repository: Repository;
  paymentGateway: PaymentGateway;
  emailSender: EmailSender;
}