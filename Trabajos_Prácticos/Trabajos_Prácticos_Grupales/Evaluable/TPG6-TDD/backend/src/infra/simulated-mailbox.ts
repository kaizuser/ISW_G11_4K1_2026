import type { EmailSender, PurchaseEmail } from '../services/dependencies';

export class SimulatedMailbox implements EmailSender {
  send(email: PurchaseEmail): Promise<void> {
    console.log(
      `[simulated email] ${email.kind} to ${email.to} (purchase ${email.purchase.id})`,
    );
    return Promise.resolve();
  }
}
