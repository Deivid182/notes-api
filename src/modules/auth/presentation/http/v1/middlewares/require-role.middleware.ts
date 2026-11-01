import { ForbiddenError, UnauthorizedError } from '#modules/shared/domain/error';

import type { RequestHandler } from 'express';

/** Debe ir después de `AuthMiddleware`. */
export const requireRole =
  (role: string): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError('Authentication required'));
    if (req.user.role !== role) return next(new ForbiddenError(`${role} role required`));
    next();
  };
