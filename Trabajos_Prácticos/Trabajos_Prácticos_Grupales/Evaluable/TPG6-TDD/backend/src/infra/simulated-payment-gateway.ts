import type { Purchase } from '../domain/purchase';
import type { PaymentGateway } from '../services/dependencies';

export class SimulatedPaymentGateway implements PaymentGateway {
  createPayment(purchase: Purchase): string {
    return `/mercado-pago/${purchase.id}`;
  }
}
