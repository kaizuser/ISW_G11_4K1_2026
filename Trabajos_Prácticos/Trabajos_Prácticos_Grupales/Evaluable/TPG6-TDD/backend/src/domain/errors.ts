export type ErrorCode =
  | 'USER_NOT_REGISTERED'
  | 'VISIT_DATE_IN_PAST'
  | 'VISIT_DATE_BEYOND_HORIZON'
  | 'SAME_DAY_CUTOFF_EXCEEDED'
  | 'PARK_CLOSED'
  | 'INVALID_TICKET_QUANTITY'
  | 'INVALID_VISITOR_AGE'
  | 'TICKET_LIMIT_PER_DATE_EXCEEDED'
  | 'PURCHASE_NOT_FOUND'
  | 'PURCHASE_ALREADY_FINALIZED';

export class DomainError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode) {
    super(code);
    this.name = 'DomainError';
    this.code = code;
  }
}
