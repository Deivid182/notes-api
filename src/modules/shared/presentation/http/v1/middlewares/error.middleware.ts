import { ZodError } from 'zod';

import { DomainError } from '#modules/shared/domain/error';
import { type Logger } from '#modules/shared/domain/interfaces/logger.interface';

import type { ErrorRequestHandler } from 'express';

const STATUS_MAP: Record<string, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
};

export function createErrorHandler(logger: Logger): ErrorRequestHandler {
  return (err, req, res, _next) => {
    // Errores de dominio → mapa directo
    if (err instanceof DomainError) {
      const status = STATUS_MAP[err.code] ?? 500;
      logger.warn('Domain error', {
        code: err.code,
        message: err.message,
        path: req.path,
        method: req.method,
      });
      res.status(status).json({
        error: { code: err.code, message: err.message },
      });
      return;
    }

    // Zod filtrado (por si algún schema se cuela sin pasar por validateBody)
    if (err instanceof ZodError) {
      logger.warn('Zod error leaked to error handler', { path: req.path });
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: err.issues,
        },
      });
      return;
    }

    // Fallback
    logger.error('Unhandled error', {
      path: req.path,
      method: req.method,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  };
}
