import type { RequestHandler } from 'express';

export function createNotFoundHandler(): RequestHandler {
  return (_req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  };
}
