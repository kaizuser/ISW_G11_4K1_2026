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

describe('CA-02 ticket quantity', () => {
  it('should reject the purchase when it has more than 10 tickets', () => {
    const elevenTickets = purchaseWithTickets(11);

    expect(() => Purchase.createForCard(elevenTickets)).toThrow(
      expect.objectContaining({ code: 'INVALID_TICKET_QUANTITY' }),
    );
  });

  it('should accept the purchase when it has exactly 10 tickets', () => {
    const tenTickets = purchaseWithTickets(10);

    expect(() => Purchase.createForCard(tenTickets)).not.toThrow();
  });

  it('should reject the purchase when it has no tickets', () => {
    expect(() => Purchase.createForCard(purchaseWithTickets(0))).toThrow(
      expect.objectContaining({ code: 'INVALID_TICKET_QUANTITY' }),
    );
  });
});

describe('CA-05 visitor ages', () => {
  it.each([-1, 2.5])(
    'should reject the purchase when a visitor age is %s',
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

  it('should accept a visitor age of 0', () => {
    const baby = { passType: PassType.REGULAR, visitorAge: 0 };

    expect(() => Purchase.createForCard(purchaseWith([baby]))).not.toThrow();
  });
});

describe('CA-06 purchase total', () => {
  it('should add the subtotals when there are no discounts', () => {
    const vip = { passType: PassType.VIP, visitorAge: 30 };
    const purchase = Purchase.createForCard(
      purchaseWith([anAdultTicket, anAdultTicket, vip]),
    );

    expect(purchase.total()).toBe(40_000);
  });

  it('should apply each visitor discount to the total', () => {
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

describe('payment method and status', () => {
  it('should wait for payment without an access code when paying by card', () => {
    const purchase = Purchase.createForCard(purchaseWithTickets(1));

    expect(purchase.paymentMethod).toBe(PaymentMethod.TARJETA);
    expect(purchase.status).toBe(PurchaseStatus.PENDIENTE_PAGO);
    expect(purchase.accessCode).toBeUndefined();
  });

  it('should be confirmed for the box office with an access code when paying in cash', () => {
    const purchase = Purchase.createForCash(
      purchaseWithTickets(1),
      'access-code',
    );

    expect(purchase.paymentMethod).toBe(PaymentMethod.EFECTIVO);
    expect(purchase.status).toBe(PurchaseStatus.CONFIRMADA_PAGO_EN_BOLETERIA);
    expect(purchase.accessCode).toBe('access-code');
  });
});

describe('RC-01 to RC-03 card payment result', () => {
  it('should be confirmed with an access code when the payment is approved', () => {
    const purchase = Purchase.createForCard(purchaseWithTickets(1));

    purchase.confirmCardPayment('access-code');

    expect(purchase.status).toBe(PurchaseStatus.CONFIRMADA);
    expect(purchase.accessCode).toBe('access-code');
  });

  it('should be rejected when the payment is rejected', () => {
    const purchase = Purchase.createForCard(purchaseWithTickets(1));

    purchase.rejectCardPayment();

    expect(purchase.status).toBe(PurchaseStatus.RECHAZADA);
  });

  it('should not change status when the purchase is already final', () => {
    const purchase = Purchase.createForCard(purchaseWithTickets(1));
    purchase.confirmCardPayment('access-code');

    expect(() => purchase.rejectCardPayment()).toThrow(
      expect.objectContaining({ code: 'PURCHASE_ALREADY_FINALIZED' }),
    );
    expect(purchase.status).toBe(PurchaseStatus.CONFIRMADA);
  });
});
