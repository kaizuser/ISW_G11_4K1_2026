import { describe, expect, it } from 'vitest';
import { Purchase, type TicketRequest } from '../../src/domain/purchase';
import {
  PassType,
  PaymentMethod,
  PurchaseStatus,
} from '../../src/domain/types';

const anAdultTicket = { passType: PassType.REGULAR, visitorAge: 30 };

function purchaseWith(tickets: TicketRequest[]) {
  return {
    id: 'purchase-1',
    userId: 'visitor-1',
    visitDate: '2026-10-17',
    tickets,
  };
}

function purchaseWithTickets(count: number) {
  return purchaseWith(Array.from({ length: count }, () => anAdultTicket));
}

describe('CA-02 cantidad de tickets', () => {
  it('debería rechazar la compra cuando es de más de 10 tickets', () => {
    const elevenTickets = purchaseWithTickets(11);

    expect(() => Purchase.createForCard(elevenTickets)).toThrow(
      expect.objectContaining({ code: 'INVALID_TICKET_QUANTITY' }),
    );
  });

  it('debería aceptar la compra cuando tiene exactamente 10 tickets', () => {
    const tenTickets = purchaseWithTickets(10);

    expect(() => Purchase.createForCard(tenTickets)).not.toThrow();
  });

  it('debería rechazar la compra cuando no tiene tickets', () => {
    expect(() => Purchase.createForCard(purchaseWithTickets(0))).toThrow(
      expect.objectContaining({ code: 'INVALID_TICKET_QUANTITY' }),
    );
  });
});

describe('CA-05 edades de los visitantes', () => {
  it.each([-1, 2.5])(
    'debería rechazar la compra cuando la edad del visitante es %s',
    (visitorAge) => {
      const tickets = [
        anAdultTicket,
        { passType: PassType.REGULAR, visitorAge },
      ];

      expect(() => Purchase.createForCard(purchaseWith(tickets))).toThrow(
        expect.objectContaining({ code: 'INVALID_VISITOR_AGE' }),
      );
    },
  );

  it('debería aceptar la compra cuando la edad del visitante es 0', () => {
    const baby = { passType: PassType.REGULAR, visitorAge: 0 };

    expect(() => Purchase.createForCard(purchaseWith([baby]))).not.toThrow();
  });
});

describe('CA-06 total de la compra', () => {
  it('debería sumar los subtotales cuando no hay descuentos', () => {
    const vip = { passType: PassType.VIP, visitorAge: 30 };
    const purchase = Purchase.createForCard(
      purchaseWith([anAdultTicket, anAdultTicket, vip]),
    );

    expect(purchase.total()).toBe(40_000);
  });

  it('debería aplicar el descuento correspondiente a cada visitante al total', () => {
    const tickets = [
      { passType: PassType.REGULAR, visitorAge: 40 },
      { passType: PassType.REGULAR, visitorAge: 2 },
      { passType: PassType.VIP, visitorAge: 10 },
      { passType: PassType.VIP, visitorAge: 65 },
    ];

    const purchase = Purchase.createForCard(purchaseWith(tickets));

    expect(purchase.total()).toBe(30_000);
  });
});

describe('método de pago y status', () => {
  it('debería esperar el pago sin un código de acceso cuando se paga con tarjeta', () => {
    const purchase = Purchase.createForCard(purchaseWithTickets(1));

    expect(purchase.paymentMethod).toBe(PaymentMethod.TARJETA);
    expect(purchase.status).toBe(PurchaseStatus.PENDIENTE_PAGO);
    expect(purchase.accessCode).toBeUndefined();
  });

  it('debería ser confirmada para la boletería con un código de acceso cuando se paga en efectivo', () => {
    const purchase = Purchase.createForCash(
      purchaseWithTickets(1),
      'access-code',
    );

    expect(purchase.paymentMethod).toBe(PaymentMethod.EFECTIVO);
    expect(purchase.status).toBe(PurchaseStatus.CONFIRMADA_PAGO_EN_BOLETERIA);
    expect(purchase.accessCode).toBe('access-code');
  });
});

describe('RC-01 a RC-03 resultados del pago con tarjeta', () => {
  it('debería ser confirmada con un código de acceso cuando el pago sea aprobado', () => {
    const purchase = Purchase.createForCard(purchaseWithTickets(1));

    purchase.confirmCardPayment('access-code');

    expect(purchase.status).toBe(PurchaseStatus.CONFIRMADA);
    expect(purchase.accessCode).toBe('access-code');
  });

  it('debería ser rechazada cuando el pago sea rechazado', () => {
    const purchase = Purchase.createForCard(purchaseWithTickets(1));

    purchase.rejectCardPayment();

    expect(purchase.status).toBe(PurchaseStatus.RECHAZADA);
  });

  it('no debería cambiar el estado cuando la compra ya esté finalizada', () => {
    const purchase = Purchase.createForCard(purchaseWithTickets(1));
    purchase.confirmCardPayment('access-code');

    expect(() => purchase.rejectCardPayment()).toThrow(
      expect.objectContaining({ code: 'PURCHASE_ALREADY_FINALIZED' }),
    );
    expect(purchase.status).toBe(PurchaseStatus.CONFIRMADA);
  });
});
