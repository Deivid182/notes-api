import { describe, expect, it } from 'vitest';

import { UnauthorizedError } from '#modules/shared/domain/error';

import { RefreshToken } from '../domain/refresh-token.entity.js';

import { LogoutUseCase } from './logout.use-case.js';

import type { TokenService } from '../domain/interfaces/token-service.interface.js';
import type { RefreshTokenRepository } from '../domain/refresh-token.repository.js';

const at = new Date('2026-01-01T00:00:00Z');
const future = new Date('2027-01-01T00:00:00Z');

class InMemoryRefreshTokens implements RefreshTokenRepository {
  items = new Map<string, RefreshToken>();
  async findById(id: string) {
    return this.items.get(id) ?? null;
  }
  async save(t: RefreshToken) {
    this.items.set(t.id, t);
  }
  async revokeAllForUser(userId: string, when: Date) {
    for (const t of this.items.values()) if (t.userId === userId && !t.isRevoked()) t.revoke(when);
  }
}

/** Token "válido" = `ok:<userId>:<jti>`; cualquier otra cosa lanza. */
const tokenService = {
  async verifyRefreshToken(token: string) {
    const [tag, sub, jti] = token.split(':');
    if (tag !== 'ok' || !sub || !jti) throw new Error('invalid');
    return { sub, jti };
  },
} as unknown as TokenService;

function setup() {
  const repo = new InMemoryRefreshTokens();
  for (const [id, userId] of [
    ['j1', 'alice'],
    ['j2', 'alice'],
    ['j3', 'bob'],
  ] as const) {
    repo.items.set(
      id,
      RefreshToken.create({ id, userId, tokenHash: 'h', expiresAt: future, revokedAt: null }),
    );
  }
  return { repo, logout: new LogoutUseCase(tokenService, repo, { now: () => at }) };
}

describe('LogoutUseCase', () => {
  it('revokes only the presented refresh token', async () => {
    const { repo, logout } = setup();
    await logout.execute({ refreshToken: 'ok:alice:j1' });
    expect(repo.items.get('j1')?.isRevoked()).toBe(true);
    expect(repo.items.get('j2')?.isRevoked()).toBe(false);
  });

  it('is idempotent for invalid or missing tokens', async () => {
    const { repo, logout } = setup();
    await expect(logout.execute({ refreshToken: 'garbage' })).resolves.toBeUndefined();
    await expect(logout.execute({})).resolves.toBeUndefined();
    expect([...repo.items.values()].some((t) => t.isRevoked())).toBe(false);
  });

  it('revokes all sessions identified by the refresh token alone', async () => {
    const { repo, logout } = setup();
    await logout.execute({ refreshToken: 'ok:alice:j1', all: true });
    expect(repo.items.get('j1')?.isRevoked()).toBe(true);
    expect(repo.items.get('j2')?.isRevoked()).toBe(true);
    expect(repo.items.get('j3')?.isRevoked()).toBe(false);
  });

  it('prefers the authenticated userId over the refresh token for "all"', async () => {
    const { repo, logout } = setup();
    await logout.execute({ userId: 'bob', refreshToken: 'ok:alice:j1', all: true });
    expect(repo.items.get('j3')?.isRevoked()).toBe(true);
    expect(repo.items.get('j1')?.isRevoked()).toBe(false);
  });

  it('rejects "all" when nothing identifies the user', async () => {
    const { logout } = setup();
    await expect(logout.execute({ all: true })).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(logout.execute({ all: true, refreshToken: 'garbage' })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});
