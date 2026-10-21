import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import { InMemoryRepository } from '../../src/infra/in-memory-repository';
import { FakePaymentGateway, FixedClock, SpyEmailSender } from '../doubles';

const ana = {
  id: 'visitor-1',
  email: 'ana.perez@correo.com',
  name: 'Ana Pérez',
};
const aFridayMorning = { date: '2026-10-16', time: '10:00' };

function aPurchase(overrides: Record<string, unknown> = {}) {
  return {
    visitDate: '2026-10-17',
    tickets: [{ passType: 'REGULAR', visitorAge: 30 }],
    paymentMethod: 'TARJETA',
    ...overrides,
  };
}

function anApp(sessionUserId = ana.id) {
  const deps = {
    clock: new FixedClock(aFridayMorning),
    repository: new InMemoryRepository([ana]),
    paymentGateway: new FakePaymentGateway(),
    emailSender: new SpyEmailSender(),
  };
  return createApp(deps, sessionUserId);
}

let app: ReturnType<typeof anApp>;

beforeEach(() => {
  app = anApp();
});

describe('PU-OF-02 purchase without payment method', () => {
  it('should respond 400 VALIDATION_ERROR when the payment method is missing', async () => {
    const withoutPaymentMethod = aPurchase({ paymentMethod: undefined });

    const response = await request(app)
      .post('/api/purchases')
      .send(withoutPaymentMethod);

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});

describe('official user tests through the API', () => {
  it('PU-OF-01: should register a card purchase, redirect and confirm it after payment', async () => {
    const created = await request(app).post('/api/purchases').send(aPurchase());
    const { purchaseId } = created.body as { purchaseId: string };

    const paid = await request(app)
      .post(`/api/purchases/${purchaseId}/payment-result`)
      .send({ approved: true });

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ status: 'PENDIENTE_PAGO' });
    expect(created.body).toHaveProperty('redirectUrl');
    expect(paid.status).toBe(200);
    expect(paid.body).toMatchObject({
      status: 'CONFIRMADA',
      ticketCount: 1,
      visitDate: '2026-10-17',
    });
  });

  it('PU-OF-03: should respond 422 PARK_CLOSED when the visit date is a Monday', async () => {
    const response = await request(app)
      .post('/api/purchases')
      .send(aPurchase({ visitDate: '2026-10-19' }));

    expect(response.status).toBe(422);
    expect(response.body).toEqual({ code: 'PARK_CLOSED' });
  });

  it('PU-OF-04: should respond 422 INVALID_TICKET_QUANTITY when buying more than 10 tickets', async () => {
    const elevenTickets = Array.from({ length: 11 }, () => ({
      passType: 'REGULAR',
      visitorAge: 30,
    }));

    const response = await request(app)
      .post('/api/purchases')
      .send(aPurchase({ tickets: elevenTickets }));

    expect(response.status).toBe(422);
    expect(response.body).toEqual({ code: 'INVALID_TICKET_QUANTITY' });
  });
});

describe('error contract', () => {
  it('should respond 403 when the session user is not registered', async () => {
    const response = await request(anApp('unknown-user'))
      .post('/api/purchases')
      .send(aPurchase());

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ code: 'USER_NOT_REGISTERED' });
  });

  it('should respond 400 when the visit date is not a real calendar date', async () => {
    const response = await request(app)
      .post('/api/purchases')
      .send(aPurchase({ visitDate: '2026-02-30' }));

    expect(response.status).toBe(400);
  });

  it('should respond 404 when the purchase does not exist', async () => {
    const response = await request(app).get('/api/purchases/unknown-purchase');

    expect(response.status).toBe(404);
  });

  it('should respond 409 when the payment result arrives twice', async () => {
    const created = await request(app).post('/api/purchases').send(aPurchase());
    const { purchaseId } = created.body as { purchaseId: string };
    await request(app)
      .post(`/api/purchases/${purchaseId}/payment-result`)
      .send({ approved: true });

    const response = await request(app)
      .post(`/api/purchases/${purchaseId}/payment-result`)
      .send({ approved: false });

    expect(response.status).toBe(409);
  });
});

describe('frontend support endpoints', () => {
  it('should list the available dates starting today', async () => {
    const response = await request(app).get('/api/calendar/available-dates');

    expect(response.status).toBe(200);
    expect((response.body as { dates: string[] }).dates[0]).toBe('2026-10-16');
  });

  it('should quote the tickets with their discounts', async () => {
    const response = await request(app)
      .post('/api/purchases/quote')
      .send({ tickets: [{ passType: 'VIP', visitorAge: 65 }] });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ total: 10_000 });
  });

  it('should return the purchase summary', async () => {
    const created = await request(app)
      .post('/api/purchases')
      .send(aPurchase({ paymentMethod: 'EFECTIVO' }));
    const { purchaseId } = created.body as { purchaseId: string };

    const response = await request(app).get(`/api/purchases/${purchaseId}`);

    expect(response.body).toMatchObject({
      status: 'CONFIRMADA_PAGO_EN_BOLETERIA',
      total: 10_000,
    });
  });
});

describe('simulated email', () => {
  async function aCashPurchase() {
    const created = await request(app)
      .post('/api/purchases')
      .send(aPurchase({ paymentMethod: 'EFECTIVO' }));
    return (created.body as { purchaseId: string }).purchaseId;
  }

  it('should return the email with its QR code and attachment link', async () => {
    const purchaseId = await aCashPurchase();

    const response = await request(app).get(
      `/api/purchases/${purchaseId}/email`,
    );
    const email = response.body as { qrCode: string; attachmentUrl: string };

    expect(response.status).toBe(200);
    expect(email.qrCode).toMatch(/^data:image\/png;base64,/);
    expect(email.attachmentUrl).toBe(`/api/purchases/${purchaseId}/receipt`);
  });

  it('should download the receipt as a PDF', async () => {
    const purchaseId = await aCashPurchase();

    const response = await request(app)
      .get(`/api/purchases/${purchaseId}/receipt`)
      .buffer(true);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/pdf');
    expect(response.headers['content-disposition']).toContain(
      'comprobante-ECO-',
    );
  });
});
