import { Router } from 'express';

import { type AuthModule } from '#modules/auth/auth.module';
import { validateRequest } from '#modules/shared/presentation/http/v1/middlewares/validate-request.middleware';

import { AuthController } from './auth.controller.js';
import { loginSchema, logoutSchema, refreshSchema, registerSchema } from './auth.schemas.js';
import { AuthMiddleware } from './middlewares/auth.middleware.js';

export interface AuthRouterDeps {
  useCases: AuthModule['useCases'];
  tokenService: AuthModule['tokenService'];
  secureCookies: boolean;
}

export function createAuthRouter({
  useCases,
  tokenService,
  secureCookies,
}: AuthRouterDeps): Router {
  const router = Router();
  const controller = new AuthController(useCases, secureCookies);
  const authMiddleware = AuthMiddleware(tokenService);

  router.post('/register', validateRequest(registerSchema), controller.register);
  router.post('/login', validateRequest(loginSchema), controller.login);
  // /refresh es público: el access token ya puede estar vencido; la autoridad es el refresh token.
  router.post('/refresh', validateRequest(refreshSchema), controller.refresh);
  router.post('/logout', authMiddleware, validateRequest(logoutSchema), controller.logout);

  return router;
}
