import express, { type Express } from 'express';

import { createAuthRouter } from '#modules/auth/presentation/http/v1/auth.router';
import { type Container } from '#modules/shared/infrastructure/config/container';
import { createUsersRouter } from '#modules/users/presentation/http/v1/users.router';

import { createErrorHandler } from './middlewares/error.middleware.js';
import { createNotFoundHandler } from './middlewares/not-found.middleware.js';

// import type { Container } from '../../config/container.js';
// import { createNotesRouter } from '../../modules/notes/presentation/http/notes.router.js';
// import { createErrorHandler, createNotFoundHandler } from './middlewares/error-handler.js';

export function createHttpServer(container: Container): Express {
  const app = express();

  // --- Global middlewares ---
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  // Request logger ligero (structured)
  app.use((req, _res, next) => {
    container.logger.debug('http.request', {
      method: req.method,
      path: req.path,
    });
    next();
  });

  // --- Health (sin auth) ---
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  // --- Routers por módulo ---
  app.use('/api/v1/users', createUsersRouter(container));
  app.use('/api/v1/auth', createAuthRouter(container));
  // app.use('/api/notes', createNotesRouter(container));

  // --- Errores ---
  app.use(createNotFoundHandler());
  app.use(createErrorHandler(container.logger));

  return app;
}
