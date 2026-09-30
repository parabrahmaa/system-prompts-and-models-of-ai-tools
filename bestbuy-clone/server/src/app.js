import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { authOptional } from './auth.js';
import { HttpError } from './util.js';
import { productsRouter } from './routes/products.js';
import { accountRouter } from './routes/account.js';
import { cartRouter, guestCartRouter } from './routes/cart.js';
import { ordersRouter } from './routes/orders.js';
import { savedRouter } from './routes/saved.js';
import { adminRouter } from './routes/admin.js';

const CLIENT_DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');

export function createApp(db) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '200kb' }));
  app.use((_req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    next();
  });

  const api = express.Router();
  api.use(authOptional(db));
  api.get('/health', (_req, res) => res.json({ ok: true }));
  api.use(productsRouter(db));
  api.use(accountRouter(db));
  api.use(guestCartRouter(db));
  api.use(cartRouter(db));
  api.use(savedRouter(db));
  api.use(ordersRouter(db));
  api.use(adminRouter(db));
  api.use((_req, _res, next) => next(new HttpError(404, 'API route not found')));
  app.use('/api', api);

  // In production the API also serves the built React app.
  if (fs.existsSync(CLIENT_DIST)) {
    app.use(express.static(CLIENT_DIST, { index: false, maxAge: '1h' }));
    app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') err = new HttpError(400, 'Malformed JSON body');
    const status = err instanceof HttpError ? err.status : 500;
    if (status === 500) console.error(err);
    res.status(status).json({ error: status === 500 ? 'Something went wrong. Please try again.' : err.message, ...(err.details || {}) });
  });

  return app;
}
