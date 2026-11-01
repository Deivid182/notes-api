import { describe, expect, it } from 'vitest';

import { ValidationError } from '#modules/shared/domain/error';

import { Password } from './password.vo.js';

describe('Password', () => {
  it('accepts the boundaries: 8 characters and 72 bytes', () => {
    expect(Password.create('12345678').reveal()).toBe('12345678');
    expect(() => Password.create('a'.repeat(72))).not.toThrow();
  });

  it('rejects short passwords', () => {
    expect(() => Password.create('1234567')).toThrow(ValidationError);
    expect(() => Password.create('')).toThrow(ValidationError);
  });

  it('measures the limit in bytes, not characters', () => {
    // 25 × "€" = 25 caracteres pero 75 bytes: bcrypt truncaría la cola.
    expect(() => Password.create('€'.repeat(25))).toThrow(/72 bytes/);
    expect(() => Password.create('€'.repeat(24))).not.toThrow();
  });

  it('never leaks the plain text through string or JSON conversion', () => {
    const password = Password.create('super-secret-1');
    expect(String(password)).toBe('[REDACTED]');
    expect(JSON.stringify({ password })).toBe('{"password":"[REDACTED]"}');
    expect(`${password}`).not.toContain('super');
  });
});
