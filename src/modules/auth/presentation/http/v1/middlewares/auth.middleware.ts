import { type TokenService } from '#modules/auth/domain/interfaces/token-service.interface';
import { UnauthorizedError } from '#modules/shared/domain/error';

import type { NextFunction, Request, RequestHandler, Response } from 'express';

export const AuthMiddleware = (tokenService: TokenService): RequestHandler => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return next(new UnauthorizedError('Missing bearer token'));
    }
    const token = header.slice('Bearer '.length).trim();
    try {
      const payload = await tokenService.verifyAccessToken(token);
      req.user = { id: payload.sub, role: payload.role };
      next();
    } catch {
      next(new UnauthorizedError('Invalid or expired token'));
    }
  };
};

/**
 * Identifica al usuario si trae un access token válido; si falta o está vencido sigue como
 * anónimo. Para endpoints que aceptan otra credencial (p. ej. logout con refresh token).
 */
export const OptionalAuthMiddleware = (tokenService: TokenService): RequestHandler => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      try {
        const payload = await tokenService.verifyAccessToken(header.slice('Bearer '.length).trim());
        req.user = { id: payload.sub, role: payload.role };
      } catch {
        // Token inválido o vencido: se trata como anónimo.
      }
    }
    next();
  };
};
