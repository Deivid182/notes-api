import { ValidationError } from '#modules/shared/domain/error';

import type { RequestHandler } from 'express';
import type z from 'zod';

export const validateRequest =
  (schema: z.ZodType, source: 'body' | 'query' | 'params' = 'body'): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const msg = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      return next(new ValidationError(msg));
    }
    // En Express 5 `req.query` es un getter de solo lectura: se redefine en la instancia.
    Object.defineProperty(req, source, {
      value: result.data,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    next();
  };
