import { describe, expect, it } from 'vitest';

import { RefreshToken } from './refresh-token.entity.js';

const make = (revokedAt: Date | null = null) =>
  RefreshToken.create({
    id: 'j1',
    userId: 'u1',
    tokenHash: 'h',
    expiresAt: new Date('2026-01-02T00:00:00Z'),
    revokedAt,
  });

describe('RefreshToken', () => {
  it('is valid before expiry and not revoked', () => {
    expect(make().isValid(new Date('2026-01-01T00:00:00Z'))).toBe(true);
  });

  it('expires exactly at expiresAt', () => {
    const token = make();
    expect(token.isExpired(new Date('2026-01-01T23:59:59Z'))).toBe(false);
    expect(token.isExpired(new Date('2026-01-02T00:00:00Z'))).toBe(true);
    expect(token.isValid(new Date('2026-01-03T00:00:00Z'))).toBe(false);
  });

  it('becomes invalid once revoked', () => {
    const token = make();
    const at = new Date('2026-01-01T00:00:00Z');
    token.revoke(at);
    expect(token.isRevoked()).toBe(true);
    expect(token.revokedAt).toEqual(at);
    expect(token.isValid(at)).toBe(false);
  });

  it('copies the props on create', () => {
    const props = {
      id: 'j',
      userId: 'u',
      tokenHash: 'h',
      expiresAt: new Date(),
      revokedAt: null,
    };
    const token = RefreshToken.create(props);
    token.revoke(new Date());
    expect(props.revokedAt).toBeNull();
  });
});
