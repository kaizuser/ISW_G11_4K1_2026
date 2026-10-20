import { createApp } from './app';
import { InMemoryRepository } from './infra/in-memory-repository';
import { SimulatedMailbox } from './infra/simulated-mailbox';
import { SimulatedPaymentGateway } from './infra/simulated-payment-gateway';
import { SystemClock } from './infra/system-clock';

// Registered users. Login is out of scope (FAQ 19), so there is a single mock visitor.
const users = [
  { id: 'visitor-1', email: 'ana.perez@correo.com', name: 'Ana Pérez' },
];

const port = Number(process.env.PORT ?? 3000);
const timeZone = process.env.PARK_TIMEZONE ?? 'America/Argentina/Cordoba';
const sessionUserId = process.env.MOCK_SESSION_USER_ID ?? 'visitor-1';

const app = createApp(
  {
    clock: new SystemClock(timeZone),
    repository: new InMemoryRepository(users),
    paymentGateway: new SimulatedPaymentGateway(),
    emailSender: new SimulatedMailbox(),
  },
  sessionUserId,
);

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
