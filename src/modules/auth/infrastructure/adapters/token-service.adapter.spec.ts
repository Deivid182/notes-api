import jwt from 'jsonwebtoken';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { JwtTokenServiceAdapter } from './token-service.adapter.js';

const make = (overrides: Partial<ConstructorParameters<typeof JwtTokenServiceAdapter>[0]> = {}) =>
  new JwtTokenServiceAdapter({
    accessSecret: 'access',
    refreshSecret: 'refresh',
    accessExpiresIn: '900',
    refreshExpiresIn: '604800',
    ...overrides,
  });

afterEach(() => vi.useRealTimers());

describe('JwtTokenServiceAdapter', () => {
  it('round-trips access and refresh tokens', async () => {
    const svc = make();
    const access = await svc.generateAccessToken({ sub: 'u1', role: 'admin' });
    expect(await svc.verifyAccessToken(access)).toEqual({ sub: 'u1', role: 'admin' });

    const refresh = await svc.generateRefreshToken({ sub: 'u1', jti: 'j1' });
    expect(await svc.verifyRefreshToken(refresh)).toEqual({ sub: 'u1', jti: 'j1' });
  });

  it('does not accept a token signed with the other secret', async () => {
    const svc = make();
    const refresh = await svc.generateRefreshToken({ sub: 'u1', jti: 'j1' });
    await expect(svc.verifyAccessToken(refresh)).rejects.toThrow();
    await expect(
      make({ accessSecret: 'other' }).verifyAccessToken(
        await svc.generateAccessToken({ sub: 'u', role: 'user' }),
      ),
    ).rejects.toThrow();
  });

  it('reads a bare numeric expiry as seconds (not milliseconds)', async () => {
    const token = await make({ accessExpiresIn: '900' }).generateAccessToken({
      sub: 'u',
      role: 'user',
    });
    const { iat, exp } = jwt.decode(token) as { iat: number; exp: number };
    expect(exp - iat).toBe(900);
  });

  it('accepts unit expiries and rejects expired tokens', async () => {
    const svc = make({ accessExpiresIn: '1m' });
    vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') });
    const token = await svc.generateAccessToken({ sub: 'u', role: 'user' });
    vi.setSystemTime(new Date('2026-01-01T00:02:00Z'));
    await expect(svc.verifyAccessToken(token)).rejects.toThrow(/expired/);
  });

  it('hashes tokens deterministically with sha256', () => {
    const svc = make();
    expect(svc.hashToken('abc')).toBe(svc.hashToken('abc'));
    expect(svc.hashToken('abc')).not.toBe(svc.hashToken('abd'));
    expect(svc.hashToken('abc')).toMatch(/^[0-9a-f]{64}$/);
  });

  it.each([
    ['604800', 604_800_000],
    ['30s', 30_000],
    ['15m', 900_000],
    ['2h', 7_200_000],
    ['7d', 604_800_000],
  ])('computes the refresh expiry for %s', (expiresIn, ms) => {
    vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') });
    const expiry = make({ refreshExpiresIn: expiresIn }).getRefreshTokenExpiry();
    expect(expiry.getTime() - Date.now()).toBe(ms);
  });

  it('falls back to 7 days for an unparseable expiry', () => {
    vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') });
    const expiry = make({ refreshExpiresIn: 'soon' }).getRefreshTokenExpiry();
    expect(expiry.getTime() - Date.now()).toBe(7 * 86_400_000);
  });
});
