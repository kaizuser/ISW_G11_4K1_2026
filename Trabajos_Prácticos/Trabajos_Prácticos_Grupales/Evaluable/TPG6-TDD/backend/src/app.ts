import express from 'express';
import { createApiRouter, handleErrors } from './routes/api';
import type { Dependencies } from './services/dependencies';

export function createApp(deps: Dependencies, sessionUserId: string) {
  const app = express();
  app.use(express.json());
  app.use('/api', createApiRouter(deps, sessionUserId));
  app.use(handleErrors);
  return app;
}
