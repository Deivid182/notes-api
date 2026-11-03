import { describe, expect, it, vi } from 'vitest';
import { type ZodError, z } from 'zod';

import { ForbiddenError, NotFoundError, ValidationError } from '#modules/shared/domain/error';

import { createErrorHandler } from './error.middleware.js';
import { createNotFoundHandler } from './not-found.middleware.js';
import { validateRequest } from './validate-request.middleware.js';

import type { Request, Response } from 'express';

function fakeRes() {
  const res = {
    req: { originalUrl: '/x' },
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response & typeof res;
}
const logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const req = { path: '/x', method: 'GET' } as Request;

describe('error handler', () => {
  const handler = createErrorHandler(logger);

  it.each([
    [new ValidationError('bad'), 400, 'VALIDATION_ERROR'],
    [new ForbiddenError('no'), 403, 'FORBIDDEN'],
    [new NotFoundError('gone'), 404, 'NOT_FOUND'],
  ])('maps %s to its status', (err, status, code) => {
    const res = fakeRes();
    handler(err, req, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(status);
    expect(res.json.mock.calls[0]?.[0]).toMatchObject({
      success: false,
      message: err.message,
      error: { code },
    });
    expect(logger.warn).toHaveBeenCalled();
  });

  it('reports leaked ZodErrors as 400 with details', () => {
    const res = fakeRes();
    const parsed = z.object({ a: z.string() }).safeParse({});
    handler(parsed.error as ZodError, req, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0]?.[0];
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details).toHaveLength(1);
  });

  it('hides unexpected errors behind a 500 and logs them', () => {
    const res = fakeRes();
    handler(new Error('db password leaked'), req, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.json.mock.calls[0]?.[0];
    expect(body.message).toBe('Internal server error');
    expect(JSON.stringify(body)).not.toContain('leaked');
    expect(logger.error).toHaveBeenCalledWith(
      'Unhandled error',
      expect.objectContaining({ message: 'db password leaked' }),
    );
  });

  it('copes with non-Error throwables', () => {
    const res = fakeRes();
    handler('oops', req, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('not-found handler', () => {
  it('answers 404 with the error envelope', () => {
    const res = fakeRes();
    createNotFoundHandler()({} as Request, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json.mock.calls[0]?.[0]).toMatchObject({
      success: false,
      message: 'Route not found',
      error: { code: 'NOT_FOUND' },
    });
  });
});

describe('validateRequest', () => {
  const schema = z.object({ n: z.coerce.number().int() });

  it('replaces the source with the parsed value (coercion applied)', () => {
    const r = { query: { n: '5' } } as unknown as Request;
    const next = vi.fn();
    validateRequest(schema, 'query')(r, {} as Response, next);
    expect(r.query).toEqual({ n: 5 });
    expect(next).toHaveBeenCalledWith();
  });

  it('forwards a ValidationError listing every issue', () => {
    const r = { body: { n: 'x' } } as unknown as Request;
    const next = vi.fn();
    validateRequest(schema)(r, {} as Response, next);
    const err = next.mock.calls[0]?.[0];
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.message).toMatch(/^n: /);
  });
});
