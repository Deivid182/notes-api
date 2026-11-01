import { UnauthorizedError } from '#modules/shared/domain/error';

import type { Actor } from '#modules/shared/domain/actor';
import type { Request } from 'express';

/** Actor autenticado de la request (poblado por `AuthMiddleware`). */
export function actorOf(req: Request): Actor {
  if (!req.user) throw new UnauthorizedError('Authentication required');
  return req.user;
}
