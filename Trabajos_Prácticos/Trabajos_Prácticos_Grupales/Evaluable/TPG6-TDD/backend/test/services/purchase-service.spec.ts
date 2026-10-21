import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Purchase } from '../../src/domain/purchase';
import {
  PassType,
  PaymentMethod,
  PurchaseStatus,
} from '../../src/domain/types';
import { InMemoryRepository } from '../../src/infra/in-memory-repository';
import type { Dependencies } from '../../src/services/dependencies';
import {
  getAvailableDates,
  getPurchaseEmail,
  processPaymentResult,
  purchaseTickets,
  quotePurchase,
} from '../../src/services/purchase-service';
import {
  FailingEmailSender,
  FakePaymentGateway,
  FixedClock,
  SpyEmailSender,
} from '../doubles';

const ana = {
  id: 'visitor-1',
  email: 'ana.perez@correo.com',
  name: 'Ana Pérez',
};
const aFridayMorning = { date: '2026-10-16', time: '10:00' };
const aSaturday = '2026-10-17';
const anAdult = { passType: PassType.REGULAR, visitorAge: 30 };

function adults(count: number) {
  return Array.from({ length: count }, () => anAdult);
}

function aRequest(
  overrides: Partial<Parameters<typeof purchaseTickets>[1]> = {},
) {
  return {
    visitDate: aSaturday,
    tickets: adults(1),
    paymentMethod: PaymentMethod.TARJETA,
    ...overrides,
  };
}

let repository: InMemoryRepository;
let paymentGateway: FakePaymentGateway;
let emailSender: SpyEmailSender;
let deps: Dependencies;

beforeEach(() => {
  repository = new InMemoryRepository([ana]);
  paymentGateway = new FakePaymentGateway();
  emailSender = new SpyEmailSender();
  deps = {
    clock: new FixedClock(aFridayMorning),
    repository,
    paymentGateway,
    emailSender,
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PU-OF-01 valid card purchase', () => {
  it('should save the purchase pending payment and redirect to Mercado Pago when paying by card', async () => {
    const result = await purchaseTickets(ana.id, aRequest(), deps);

    expect(result.status).toBe(PurchaseStatus.PENDIENTE_PAGO);
    expect(result.redirectUrl).toBe(`/fake-mercado-pago/${result.purchaseId}`);
    expect(repository.findPurchase(result.purchaseId)).toBeDefined();
  });

  it('should not send an email until the card payment is approved', async () => {
    await purchaseTickets(ana.id, aRequest(), deps);

    expect(emailSender.sent).toHaveLength(0);
  });

  it('should confirm the purchase and email the visitor when the payment is approved', async () => {
    const { purchaseId } = await purchaseTickets(ana.id, aRequest(), deps);

    const result = await processPaymentResult(purchaseId, true, deps);

    expect(result.status).toBe(PurchaseStatus.CONFIRMADA);
    expect(emailSender.sent).toEqual([
      expect.objectContaining({ kind: 'PURCHASE_CONFIRMED', to: ana.email }),
    ]);
  });
});

describe('CA-10 purchase summary', () => {
  it('should report the ticket count, visit date and total', async () => {
    const result = await purchaseTickets(
      ana.id,
      aRequest({ tickets: adults(3) }),
      deps,
    );

    expect(result).toMatchObject({
      ticketCount: 3,
      visitDate: aSaturday,
      total: 30_000,
    });
  });
});

describe('cash purchase', () => {
  it('should confirm for the box office and email the reservation without redirecting', async () => {
    const result = await purchaseTickets(
      ana.id,
      aRequest({ paymentMethod: PaymentMethod.EFECTIVO }),
      deps,
    );

    expect(result.status).toBe(PurchaseStatus.CONFIRMADA_PAGO_EN_BOLETERIA);
    expect(result.redirectUrl).toBeUndefined();
    expect(paymentGateway.payments).toHaveLength(0);
    expect(emailSender.sent).toEqual([
      expect.objectContaining({ kind: 'CASH_RESERVATION', to: ana.email }),
    ]);
  });
});

describe('CA-01 registered users only', () => {
  it('should reject the purchase when the user is not registered', async () => {
    await expect(
      purchaseTickets('unknown-user', aRequest(), deps),
    ).rejects.toThrow(expect.objectContaining({ code: 'USER_NOT_REGISTERED' }));
  });
});

describe('PU-OF-03 park closed', () => {
  it('should reject the purchase when the park is closed on the visit date', async () => {
    const aMonday = '2026-10-19';

    await expect(
      purchaseTickets(ana.id, aRequest({ visitDate: aMonday }), deps),
    ).rejects.toThrow(expect.objectContaining({ code: 'PARK_CLOSED' }));
  });
});

describe('CA-11 ticket limit per date', () => {
  function previousPurchase(ticketCount: number) {
    return Purchase.createForCash(
      {
        id: 'previous',
        userId: ana.id,
        visitDate: aSaturday,
        tickets: adults(ticketCount),
      },
      'code',
    );
  }

  it('should reject the purchase when it exceeds 10 tickets for the date with earlier purchases', async () => {
    repository.savePurchase(previousPurchase(7));

    await expect(
      purchaseTickets(ana.id, aRequest({ tickets: adults(4) }), deps),
    ).rejects.toThrow(
      expect.objectContaining({ code: 'TICKET_LIMIT_PER_DATE_EXCEEDED' }),
    );
  });

  it('should accept the purchase when it reaches exactly 10 tickets for the date', async () => {
    repository.savePurchase(previousPurchase(7));

    await expect(
      purchaseTickets(ana.id, aRequest({ tickets: adults(3) }), deps),
    ).resolves.toBeDefined();
  });

  it('should not count rejected purchases toward the limit', async () => {
    const { purchaseId } = await purchaseTickets(
      ana.id,
      aRequest({ tickets: adults(10) }),
      deps,
    );
    await processPaymentResult(purchaseId, false, deps);

    await expect(
      purchaseTickets(ana.id, aRequest({ tickets: adults(10) }), deps),
    ).resolves.toBeDefined();
  });
});

describe('RC-02 rejected card payment', () => {
  it('should reject the purchase and notify the visitor', async () => {
    const { purchaseId } = await purchaseTickets(ana.id, aRequest(), deps);

    const result = await processPaymentResult(purchaseId, false, deps);

    expect(result.status).toBe(PurchaseStatus.RECHAZADA);
    expect(emailSender.sent).toEqual([
      expect.objectContaining({ kind: 'PAYMENT_REJECTED' }),
    ]);
  });

  it('should fail when the purchase does not exist', async () => {
    await expect(
      processPaymentResult('unknown-purchase', true, deps),
    ).rejects.toThrow(expect.objectContaining({ code: 'PURCHASE_NOT_FOUND' }));
  });
});

describe('RC-04 email failure', () => {
  it('should keep the purchase registered when the email cannot be sent', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    deps.emailSender = new FailingEmailSender();

    const result = await purchaseTickets(
      ana.id,
      aRequest({ paymentMethod: PaymentMethod.EFECTIVO }),
      deps,
    );

    expect(repository.findPurchase(result.purchaseId)).toBeDefined();
    expect(console.error).toHaveBeenCalled();
  });
});

describe('quote and available dates', () => {
  it('should quote each ticket with its discount and the total', () => {
    const quote = quotePurchase([
      anAdult,
      { passType: PassType.VIP, visitorAge: 10 },
    ]);

    expect(quote.tickets).toEqual([
      { listPrice: 10_000, discountPercent: 0, subtotal: 10_000 },
      { listPrice: 20_000, discountPercent: 50, subtotal: 10_000 },
    ]);
    expect(quote.total).toBe(20_000);
  });

  it('should list available dates from the clock', () => {
    expect(getAvailableDates(ana.id, deps).at(0)).toBe(aFridayMorning.date);
  });

  it('should leave out a date when the user already has 10 tickets for it', async () => {
    await purchaseTickets(ana.id, aRequest({ tickets: adults(10) }), deps);

    expect(getAvailableDates(ana.id, deps)).not.toContain(aSaturday);
  });

  it('should keep a date when the user still has tickets left for it', async () => {
    await purchaseTickets(ana.id, aRequest({ tickets: adults(7) }), deps);

    expect(getAvailableDates(ana.id, deps)).toContain(aSaturday);
  });
});

describe('CA-09 confirmation email content', () => {
  it('should build the box office reservation email with QR and receipt for a cash purchase', async () => {
    const { purchaseId } = await purchaseTickets(
      ana.id,
      aRequest({ paymentMethod: PaymentMethod.EFECTIVO, tickets: adults(2) }),
      deps,
    );

    const email = getPurchaseEmail(purchaseId, deps);

    expect(email).toMatchObject({
      kind: 'CASH_RESERVATION',
      to: ana.email,
      total: 20_000,
    });
    expect(email.tickets).toHaveLength(2);
    expect(email.accessCode).toBeDefined();
    expect(email.attachmentName).toMatch(/^comprobante-ECO-.+\.pdf$/);
  });

  it('should build the confirmation email once the card payment is approved', async () => {
    const { purchaseId } = await purchaseTickets(ana.id, aRequest(), deps);
    await processPaymentResult(purchaseId, true, deps);

    expect(getPurchaseEmail(purchaseId, deps)).toMatchObject({
      kind: 'PURCHASE_CONFIRMED',
    });
  });

  it('should build the rejection notice without QR or receipt', async () => {
    const { purchaseId } = await purchaseTickets(ana.id, aRequest(), deps);
    await processPaymentResult(purchaseId, false, deps);

    const email = getPurchaseEmail(purchaseId, deps);

    expect(email.kind).toBe('PAYMENT_REJECTED');
    expect(email.accessCode).toBeUndefined();
    expect(email.attachmentName).toBeUndefined();
  });

  it('should have no email while the card payment is pending', async () => {
    const { purchaseId } = await purchaseTickets(ana.id, aRequest(), deps);

    expect(() => getPurchaseEmail(purchaseId, deps)).toThrow(
      expect.objectContaining({ code: 'EMAIL_NOT_AVAILABLE' }),
    );
  });
});
