import { DomainError } from './errors';
import type { PassType } from './types';

const MAX_TICKETS_PER_PURCHASE = 10;

export interface TicketRequest {
  passType: PassType;
  visitorAge: number;
}

export interface PurchaseProps {
  id: string;
  userId: string;
  visitDate: string;
  tickets: TicketRequest[];
}

export class Purchase {
  static createForCard(props: PurchaseProps): Purchase {
    if (props.tickets.length > MAX_TICKETS_PER_PURCHASE) {
      throw new DomainError('INVALID_TICKET_QUANTITY');
    }
    return new Purchase();
  }
}
