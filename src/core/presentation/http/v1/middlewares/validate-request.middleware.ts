import { ValidationError } from '#modules/shared/domain/error';

import type { RequestHandler } from 'express';
import type z from 'zod';

export const validateRequest =
  (schema: z.ZodType, source: 'body' | 'query' | 'params' = 'body'): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const msg = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      return next(new ValidationError(msg));
    }
    // assign parsed
    req[source] = result.data;
    next();
  };
