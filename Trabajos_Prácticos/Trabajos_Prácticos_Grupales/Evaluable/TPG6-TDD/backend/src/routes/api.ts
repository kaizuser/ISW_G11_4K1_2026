import { Router, type ErrorRequestHandler } from 'express';
import { z } from 'zod';
import { DomainError, type ErrorCode } from '../domain/errors';
import { PassType, PaymentMethod } from '../domain/types';
import type { Dependencies } from '../services/dependencies';
import {
  getAvailableDates,
  getPurchase,
  processPaymentResult,
  purchaseTickets,
  quotePurchase,
} from '../services/purchase-service';

const ticketSchema = z.object({
  passType: z.enum(PassType),
  visitorAge: z.number(),
});

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (date) => new Date(`${date}T00:00:00Z`).toISOString().startsWith(date),
    {
      message: 'Invalid calendar date',
    },
  );

const quoteSchema = z.object({ tickets: z.array(ticketSchema) });

const purchaseSchema = z.object({
  visitDate: isoDateSchema,
  tickets: z.array(ticketSchema),
  paymentMethod: z.enum(PaymentMethod),
});

const paymentResultSchema = z.object({ approved: z.boolean() });

const HTTP_STATUS: Record<ErrorCode, number> = {
  USER_NOT_REGISTERED: 403,
  PURCHASE_NOT_FOUND: 404,
  PURCHASE_ALREADY_FINALIZED: 409,
  VISIT_DATE_IN_PAST: 422,
  VISIT_DATE_BEYOND_HORIZON: 422,
  SAME_DAY_CUTOFF_EXCEEDED: 422,
  PARK_CLOSED: 422,
  INVALID_TICKET_QUANTITY: 422,
  INVALID_VISITOR_AGE: 422,
  TICKET_LIMIT_PER_DATE_EXCEEDED: 422,
};

export function createApiRouter(
  deps: Dependencies,
  sessionUserId: string,
): Router {
  const router = Router();

  router.get('/calendar/available-dates', (_req, res) => {
    res.json({ dates: getAvailableDates(deps) });
  });

  router.post('/purchases/quote', (req, res) => {
    const { tickets } = quoteSchema.parse(req.body);
    res.json(quotePurchase(tickets));
  });

  router.post('/purchases', async (req, res) => {
    const request = purchaseSchema.parse(req.body);
    res.status(201).json(await purchaseTickets(sessionUserId, request, deps));
  });

  router.post('/purchases/:id/payment-result', async (req, res) => {
    const { approved } = paymentResultSchema.parse(req.body);
    res.json(await processPaymentResult(req.params.id, approved, deps));
  });

  router.get('/purchases/:id', (req, res) => {
    res.json(getPurchase(req.params.id, deps));
  });

  return router;
}

export const handleErrors: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof z.ZodError) {
    res.status(400).json({ code: 'VALIDATION_ERROR', errors: error.issues });
  } else if (error instanceof DomainError) {
    res.status(HTTP_STATUS[error.code]).json({ code: error.code });
  } else {
    console.error(error);
    res.status(500).json({ code: 'INTERNAL_ERROR' });
  }
};
