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

describe('PU-OF-01 compra valida con tarjeta', () => {
  it('debería guardar el pago de la compra como pendiente y redirigir a Mercado Pago cuando el pago es con tarjeta', async () => {
    const result = await purchaseTickets(ana.id, aRequest(), deps);

    expect(result.status).toBe(PurchaseStatus.PENDIENTE_PAGO);
    expect(result.redirectUrl).toBe(`/fake-mercado-pago/${result.purchaseId}`);
    expect(repository.findPurchase(result.purchaseId)).toBeDefined();
  });

  it('no debería mandar un mail hasta que el pago de la tarjeta esté aprobado', async () => {
    await purchaseTickets(ana.id, aRequest(), deps);

    expect(emailSender.sent).toHaveLength(0);
  });

  it('debería confirmar la compra y notificar via email al visitante cuando el pago esté aprobado', async () => {
    const { purchaseId } = await purchaseTickets(ana.id, aRequest(), deps);

    const result = await processPaymentResult(purchaseId, true, deps);

    expect(result.status).toBe(PurchaseStatus.CONFIRMADA);
    expect(emailSender.sent).toEqual([
      expect.objectContaining({ kind: 'PURCHASE_CONFIRMED', to: ana.email }),
    ]);
  });
});

describe('CA-10 resumen de compra', () => {
  it('debería mostrar la cantidad de tickets, la fecha de visita y el total', async () => {
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

describe('compra en efectivo', () => {
  it('debería confirmar para la boletería y enviar un correo de reserva sin redirigir', async () => {
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

describe('CA-01 solo usuarios registrados', () => {
  it('debería rechazar la compra cuando el usuario no está registrado', async () => {
    await expect(
      purchaseTickets('unknown-user', aRequest(), deps),
    ).rejects.toThrow(expect.objectContaining({ code: 'USER_NOT_REGISTERED' }));
  });
});

describe('PU-OF-03 parque cerrado', () => {
  it('debería rechazar la compra cuando el parque está cerrado en la fecha de visita', async () => {
    const aMonday = '2026-10-19';

    await expect(
      purchaseTickets(ana.id, aRequest({ visitDate: aMonday }), deps),
    ).rejects.toThrow(expect.objectContaining({ code: 'PARK_CLOSED' }));
  });
});

describe('CA-11 limite de tickets por fecha', () => {
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

  it('debería rechazar la compra cuando exceda el límite de 10 tickets para la fecha con compras anteriores', async () => {
    repository.savePurchase(previousPurchase(7));

    await expect(
      purchaseTickets(ana.id, aRequest({ tickets: adults(4) }), deps),
    ).rejects.toThrow(
      expect.objectContaining({ code: 'TICKET_LIMIT_PER_DATE_EXCEEDED' }),
    );
  });

  it('debería aceptar la compra cuando alcance exactamente 10 tickets para la fecha', async () => {
    repository.savePurchase(previousPurchase(7));

    await expect(
      purchaseTickets(ana.id, aRequest({ tickets: adults(3) }), deps),
    ).resolves.toBeDefined();
  });

  it('no debería contar las compras rechazadas para el límite', async () => {
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

describe('RC-02 pago con tarjeta rechazado', () => {
  it('debería rechazar la compra y notificar al visitante', async () => {
    const { purchaseId } = await purchaseTickets(ana.id, aRequest(), deps);

    const result = await processPaymentResult(purchaseId, false, deps);

    expect(result.status).toBe(PurchaseStatus.RECHAZADA);
    expect(emailSender.sent).toEqual([
      expect.objectContaining({ kind: 'PAYMENT_REJECTED' }),
    ]);
  });

  it('debería fallar cuando la compra no existe', async () => {
    await expect(
      processPaymentResult('unknown-purchase', true, deps),
    ).rejects.toThrow(expect.objectContaining({ code: 'PURCHASE_NOT_FOUND' }));
  });
});

describe('RC-04 fallo al enviar correo', () => {
  it('debería mantener la compra registrada cuando el mail no pueda ser enviado', async () => {
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
  it('debería aplicar a cada ticket su descuento y el total', () => {
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

  it('debería listar las fechas disponibles desde el reloj', () => {
    expect(getAvailableDates(ana.id, deps).at(0)).toBe(aFridayMorning.date);
  });

  it('debería omitir una fecha cuando el usuario ya tiene 10 tickets para ella', async () => {
    await purchaseTickets(ana.id, aRequest({ tickets: adults(10) }), deps);

    expect(getAvailableDates(ana.id, deps)).not.toContain(aSaturday);
  });

  it('debería mantener una fecha cuando el usuario aún tenga tickets disponibles para ella', async () => {
    await purchaseTickets(ana.id, aRequest({ tickets: adults(7) }), deps);

    expect(getAvailableDates(ana.id, deps)).toContain(aSaturday);
  });
});

describe('CA-09 confirmación del contenido del mail', () => {
  it('debería armar el mail para la reserva por boletería con QR y recibo para una compra en efectivo', async () => {
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

  it('debería armar el mail de confirmación una vez aprobada la compra con tarjeta', async () => {
    const { purchaseId } = await purchaseTickets(ana.id, aRequest(), deps);
    await processPaymentResult(purchaseId, true, deps);

    expect(getPurchaseEmail(purchaseId, deps)).toMatchObject({
      kind: 'PURCHASE_CONFIRMED',
    });
  });

  it('debería armar el aviso de rechazo sin QR ni recibo', async () => {
    const { purchaseId } = await purchaseTickets(ana.id, aRequest(), deps);
    await processPaymentResult(purchaseId, false, deps);

    const email = getPurchaseEmail(purchaseId, deps);

    expect(email.kind).toBe('PAYMENT_REJECTED');
    expect(email.accessCode).toBeUndefined();
    expect(email.attachmentName).toBeUndefined();
  });

  it('no debería tener ningun mail mientras el pago con tarjeta este pendiente', async () => {
    const { purchaseId } = await purchaseTickets(ana.id, aRequest(), deps);

    expect(() => getPurchaseEmail(purchaseId, deps)).toThrow(
      expect.objectContaining({ code: 'EMAIL_NOT_AVAILABLE' }),
    );
  });
});
