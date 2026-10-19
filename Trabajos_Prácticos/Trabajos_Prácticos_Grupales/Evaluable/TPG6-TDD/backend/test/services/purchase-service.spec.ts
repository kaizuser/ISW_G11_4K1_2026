import { beforeEach, describe, expect, it } from 'vitest';
import {
  PassType,
  PaymentMethod,
  PurchaseStatus,
} from '../../src/domain/types';
import { InMemoryRepository } from '../../src/infra/in-memory-repository';
import type { Dependencies } from '../../src/services/dependencies';
import { purchaseTickets } from '../../src/services/purchase-service';
import { FakePaymentGateway, FixedClock, SpyEmailSender } from '../doubles'; 

const ana = {
  id: 'visitor-1',
  email: 'ana.perez@correo.com',
  name: 'Ana Perez',
};
const aFridayMorning = { date: '2026-10-16', time: '10:00' };
const aSaturday = '2026-10-17';

describe('PU-OF-01 valid card purchase', () => {
  let repository: InMemoryRepository;
  let paymentGateway: FakePaymentGateway;
  let deps: Dependencies;

  beforeEach(() => {
    repository = new InMemoryRepository([ana]);
    paymentGateway = new FakePaymentGateway();
    deps = {
      clock: new FixedClock(aFridayMorning),
      repository,
      paymentGateway,
      emailSender: new SpyEmailSender(),
    };
  });

  it('should save the purchase pending payment and redirect to Mercado Pago when paying by card', async () => {
    const request = {
      visitDate: aSaturday,
      tickets: [{ passType: PassType.REGULAR, visitorAge: 30 }],
      paymentMethod: PaymentMethod.TARJETA,
    };

    const result = await purchaseTickets(ana.id, request, deps);

    expect(result.status).toBe(PurchaseStatus.PENDIENTE_PAGO);
    expect(result.redirectUrl).toBe(`/fake-mercado-pago/${result.purchaseId}`);
    expect(repository.findPurchase(result.purchaseId)).toBeDefined();
  });
});