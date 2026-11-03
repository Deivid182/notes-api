import type { Actor } from '#modules/shared/domain/actor';

declare global {
  namespace Express {
    interface Request {
      /** Poblado por `AuthMiddleware`. */
      user?: Actor;
    }
  }
}
