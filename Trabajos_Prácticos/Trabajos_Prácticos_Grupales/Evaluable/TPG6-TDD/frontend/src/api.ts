export type PassType = 'REGULAR' | 'VIP';
export type PaymentMethod = 'EFECTIVO' | 'TARJETA';

export interface TicketRequest {
  passType: PassType;
  visitorAge: number;
}

export interface Quote {
  tickets: { listPrice: number; discountPercent: number; subtotal: number }[];
  total: number;
}

export interface PurchaseRequest {
  visitDate: string;
  tickets: TicketRequest[];
  paymentMethod: PaymentMethod;
}

export interface PurchaseResult {
  purchaseId: string;
  visitDate: string;
  ticketCount: number;
  total: number;
  status: string;
  redirectUrl?: string;
}

const errorMessages: Record<string, string> = {
  VALIDATION_ERROR: 'Revisa los datos de la compra.',
  USER_NOT_REGISTERED: 'Solo los usuarios registrados pueden comprar entradas.',
  VISIT_DATE_IN_PAST: 'La fecha de visita ya pasó. Elige otra fecha.',
  VISIT_DATE_BEYOND_HORIZON: 'Solo puedes comprar con hasta un mes de anticipación.',
  SAME_DAY_CUTOFF_EXCEEDED: 'Para hoy solo se puede comprar hasta las 17:30.',
  PARK_CLOSED: 'El parque está cerrado ese día. Elige otra fecha.',
  INVALID_TICKET_QUANTITY: 'Puedes comprar entre 1 y 10 entradas.',
  INVALID_VISITOR_AGE: 'Revisa las edades: deben ser números enteros desde 0.',
  TICKET_LIMIT_PER_DATE_EXCEEDED:
    'Superas el máximo de 10 entradas para esa fecha, sumando tus compras anteriores.',
};

export class ApiError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(errorMessages[code] ?? 'No se pudo completar la compra. Intenta nuevamente.');
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { code?: string };
    throw new ApiError(body.code ?? 'UNKNOWN');
  }
  return (await response.json()) as T;
}

export async function getAvailableDates(): Promise<string[]> {
  const { dates } = await request<{ dates: string[] }>('/api/calendar/available-dates');
  return dates;
}

export function quotePurchase(tickets: TicketRequest[], signal: AbortSignal): Promise<Quote> {
  return request<Quote>('/api/purchases/quote', {
    method: 'POST',
    body: JSON.stringify({ tickets }),
    signal,
  });
}

export function createPurchase(purchase: PurchaseRequest): Promise<PurchaseResult> {
  return request<PurchaseResult>('/api/purchases', {
    method: 'POST',
    body: JSON.stringify(purchase),
  });
}
