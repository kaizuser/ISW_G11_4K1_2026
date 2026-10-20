import type { EmailSender, PurchaseEmail } from '../services/dependencies';

/** Keeps "sent" emails in memory so the frontend can show them (FAQ 5). */
export class SimulatedMailbox implements EmailSender {
  private readonly sent: PurchaseEmail[] = [];

  send(email: PurchaseEmail): Promise<void> {
    this.sent.push(email);
    return Promise.resolve();
  }

  findByPurchase(purchaseId: string): PurchaseEmail[] {
    return this.sent.filter((email) => email.purchase.id === purchaseId);
  }
}
