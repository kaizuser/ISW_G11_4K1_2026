import { DomainError } from './errors';
import { discountPercentFor, priceFor } from './pricing';
import { PassType, PaymentMethod, PurchaseStatus } from './types';

const MIN_TICKETS_PER_PURCHASE = 1;
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

export class Ticket {
  readonly passType: PassType;
  readonly visitorAge: number;
  readonly listPrice: number;
  readonly discountPercent: number;

  private constructor(passType: PassType, visitorAge: number) {
    this.passType = passType;
    this.visitorAge = visitorAge;
    this.listPrice = priceFor(passType);
    this.discountPercent = discountPercentFor(visitorAge);
  }

  static create({ passType, visitorAge }: TicketRequest): Ticket {
    if (!Number.isInteger(visitorAge) || visitorAge < 0) {
      throw new DomainError('INVALID_VISITOR_AGE');
    }
    return new Ticket(passType, visitorAge);
  }

  subtotal(): number {
    return (this.listPrice * (100 - this.discountPercent)) / 100;
  }
}

export class Purchase {
  readonly id: string;
  readonly userId: string;
  readonly visitDate: string;
  readonly paymentMethod: PaymentMethod;
  readonly tickets: Ticket[];
  private currentStatus: PurchaseStatus;
  private currentAccessCode?: string;

  private constructor(
    props: PurchaseProps,
    paymentMethod: PaymentMethod,
    status: PurchaseStatus,
    accessCode?: string,
  ) {
    const { length } = props.tickets;
    if (
      length < MIN_TICKETS_PER_PURCHASE ||
      length > MAX_TICKETS_PER_PURCHASE
    ) {
      throw new DomainError('INVALID_TICKET_QUANTITY');
    }
    this.id = props.id;
    this.userId = props.userId;
    this.visitDate = props.visitDate;
    this.paymentMethod = paymentMethod;
    this.tickets = props.tickets.map((ticket) => Ticket.create(ticket));
    this.currentStatus = status;
    this.currentAccessCode = accessCode;
  }

  static createForCard(props: PurchaseProps): Purchase {
    return new Purchase(
      props,
      PaymentMethod.TARJETA,
      PurchaseStatus.PENDIENTE_PAGO,
    );
  }

  static createForCash(props: PurchaseProps, accessCode: string): Purchase {
    return new Purchase(
      props,
      PaymentMethod.EFECTIVO,
      PurchaseStatus.CONFIRMADA_PAGO_EN_BOLETERIA,
      accessCode,
    );
  }

  get status(): PurchaseStatus {
    return this.currentStatus;
  }

  get accessCode(): string | undefined {
    return this.currentAccessCode;
  }

  ticketCount(): number {
    return this.tickets.length;
  }

  total(): number {
    return this.tickets.reduce((sum, ticket) => sum + ticket.subtotal(), 0);
  }

  isFinal(): boolean {
    return this.currentStatus !== PurchaseStatus.PENDIENTE_PAGO;
  }

  confirmCardPayment(accessCode: string): void {
    this.ensureNotFinal();
    this.currentStatus = PurchaseStatus.CONFIRMADA;
    this.currentAccessCode = accessCode;
  }

  rejectCardPayment(): void {
    this.ensureNotFinal();
    this.currentStatus = PurchaseStatus.RECHAZADA;
  }

  private ensureNotFinal(): void {
    if (this.isFinal()) throw new DomainError('PURCHASE_ALREADY_FINALIZED');
  }
}
