import type { Purchase } from '../src/domain/purchase';
import type { ParkNow } from '../src/domain/types';
import type {
  Clock,
  EmailSender,
  PaymentGateway,
  PurchaseEmail,
} from '../src/services/dependencies';

export class FixedClock implements Clock {
  constructor(private readonly now: ParkNow) {}

  parkNow(): ParkNow {
    return this.now;
  }
}

export class FakePaymentGateway implements PaymentGateway {
  readonly payments: Purchase[] = [];

  createPayment(purchase: Purchase): string {
    this.payments.push(purchase);
    return `/fake-mercado-pago/${purchase.id}`;
  }
}

export class SpyEmailSender implements EmailSender {
  readonly sent: PurchaseEmail[] = [];

  send(email: PurchaseEmail): Promise<void> {
    this.sent.push(email);
    return Promise.resolve();
  }
}

export class FailingEmailSender implements EmailSender {
  send(): Promise<void> {
    return Promise.reject(new Error('Servidor de Mail no disponible'));
  }
}