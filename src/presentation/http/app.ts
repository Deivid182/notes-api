import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';

import { type Container } from '#app/container';
import { createAuthRouter } from '#modules/auth/presentation/http/v1/auth.router';
import { createNotesRouter } from '#modules/notes/presentation/http/v1/notes.router';
import { createErrorHandler } from '#modules/shared/presentation/http/v1/middlewares/error.middleware';
import { createNotFoundHandler } from '#modules/shared/presentation/http/v1/middlewares/not-found.middleware';
import { createUsersRouter } from '#modules/users/presentation/http/v1/users.router';

export function createHttpApp(container: Container): Express {
  const app = express();

  // --- Global middlewares ---
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

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
  const { tokenService } = container.modules.auth;
  app.use(
    '/api/v1/users',
    createUsersRouter({
      useCases: container.modules.users.useCases,
      tokenService,
    }),
  );
  app.use(
    '/api/v1/auth',
    createAuthRouter({
      useCases: container.modules.auth.useCases,
      tokenService,
      secureCookies: container.env.NODE_ENV === 'production',
    }),
  );
  app.use(
    '/api/v1/notes',
    createNotesRouter({
      useCases: container.modules.notes.useCases,
      tokenService,
    }),
  );

  // --- Errores ---
  app.use(createNotFoundHandler());
  app.use(createErrorHandler(container.logger));

  return app;
}
