import { sendError } from '../response.js';

import type { RequestHandler } from 'express';

export function createNotFoundHandler(): RequestHandler {
  return (_req, res) => {
    sendError(res, 404, 'NOT_FOUND', 'Route not found');
  };
}
