import { sendError } from '../response.js';

import type { RequestHandler } from 'express';

export function createNotFoundHandler(): RequestHandler {
  return (_req, res) => {
    sendError(res, { status: 404, code: 'NOT_FOUND', message: 'Route not found' });
  };
}
