import { describe, expect, it } from 'vitest';
import { Purchase } from '../../src/domain/purchase';
import { PassType } from '../../src/domain/types';

const anAdultTicket = { passType: PassType.REGULAR, visitorAge: 30 };

function purchaseWithTickets(count: number) {
  return {
    id: 'purchase-1',
    userId: 'visitor-1',
    visitDate: '2026-10-17',
    tickets: Array.from({ length: count }, () => anAdultTicket),
  };
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
});
