import { Router } from 'express';

import { validateRequest } from '#core/presentation/http/v1/middlewares/validate-request.middleware';
import { type Container } from '#modules/shared/infrastructure/config/container';

import { AuthController } from './auth.controller.js';
import { loginSchema, logoutSchema, refreshSchema, registerSchema } from './auth.schemas.js';
import { AuthMiddleware } from './middlewares/auth.middleware.js';

export function createAuthRouter(container: Container): Router {
  const router = Router();
  const controller = new AuthController(container);
  const authMiddleware = AuthMiddleware(container.tokenService);

  router.post('/register', validateRequest(registerSchema), controller.register);
  router.post('/login', validateRequest(loginSchema), controller.login);
  router.post('/refresh', authMiddleware, validateRequest(refreshSchema), controller.refresh);
  router.post('/logout', authMiddleware, validateRequest(logoutSchema), controller.logout);

  return router;
}
