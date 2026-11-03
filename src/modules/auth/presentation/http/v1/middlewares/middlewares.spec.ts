import { describe, expect, it, vi } from 'vitest';

import { ForbiddenError, UnauthorizedError } from '#modules/shared/domain/error';

import { AuthMiddleware, OptionalAuthMiddleware } from './auth.middleware.js';
import { requireRole } from './require-role.middleware.js';

import type { TokenService } from '#modules/auth/domain/interfaces/token-service.interface';
import type { Request, Response } from 'express';

const tokenService = {
  async verifyAccessToken(token: string) {
    if (token !== 'good') throw new Error('bad');
    return { sub: 'u1', role: 'admin' };
  },
} as unknown as TokenService;

const reqWith = (authorization?: string) =>
  ({ headers: authorization ? { authorization } : {} }) as unknown as Request;
const res = {} as Response;

describe('AuthMiddleware', () => {
  const mw = AuthMiddleware(tokenService);

  it.each([[undefined], ['Basic abc'], ['good']])(
    'rejects a missing or non-bearer header (%s)',
    async (h) => {
      const next = vi.fn();
      await mw(reqWith(h), res, next);
      expect(next.mock.calls[0]?.[0]).toBeInstanceOf(UnauthorizedError);
      expect(next.mock.calls[0]?.[0].message).toBe('Missing bearer token');
    },
  );

  it('rejects an invalid token', async () => {
    const next = vi.fn();
    await mw(reqWith('Bearer nope'), res, next);
    expect(next.mock.calls[0]?.[0].message).toBe('Invalid or expired token');
  });

  it('sets req.user and continues with a valid token', async () => {
    const req = reqWith('Bearer  good ');
    const next = vi.fn();
    await mw(req, res, next);
    expect(req.user).toEqual({ id: 'u1', role: 'admin' });
    expect(next).toHaveBeenCalledWith();
  });
});

describe('OptionalAuthMiddleware', () => {
  const mw = OptionalAuthMiddleware(tokenService);

  it('identifies the user with a valid token', async () => {
    const req = reqWith('Bearer good');
    const next = vi.fn();
    await mw(req, res, next);
    expect(req.user).toEqual({ id: 'u1', role: 'admin' });
    expect(next).toHaveBeenCalledWith();
  });

  it.each([[undefined], ['Bearer expired'], ['Token x']])('continues anonymous (%s)', async (h) => {
    const req = reqWith(h);
    const next = vi.fn();
    await mw(req, res, next);
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });
});

describe('requireRole', () => {
  const mw = requireRole('admin');

  it('requires authentication first', () => {
    const next = vi.fn();
    mw({} as Request, res, next);
    expect(next.mock.calls[0]?.[0]).toBeInstanceOf(UnauthorizedError);
  });

  it('forbids other roles', () => {
    const next = vi.fn();
    mw({ user: { id: 'u', role: 'user' } } as Request, res, next);
    expect(next.mock.calls[0]?.[0]).toBeInstanceOf(ForbiddenError);
    expect(next.mock.calls[0]?.[0].message).toBe('admin role required');
  });

  it('lets the role through', () => {
    const next = vi.fn();
    mw({ user: { id: 'u', role: 'admin' } } as Request, res, next);
    expect(next).toHaveBeenCalledWith();
  });
});
