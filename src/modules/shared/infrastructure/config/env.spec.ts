import { describe, expect, it } from 'vitest';

import { parseEnv } from './env.js';

const base = { JWT_ACCESS_SECRET: 'a', JWT_REFRESH_SECRET: 'b' };

describe('parseEnv', () => {
  it('applies defaults', () => {
    const env = parseEnv(base);
    expect(env.DATABASE_ENGINE).toBe('sqlite');
    expect(env.RUN_MIGRATIONS).toBe(false);
  });

  it.each([
    ['true', true],
    ['1', true],
    ['false', false],
    ['0', false],
  ])('parses RUN_MIGRATIONS=%s as %s', (raw, expected) => {
    expect(parseEnv({ ...base, RUN_MIGRATIONS: raw }).RUN_MIGRATIONS).toBe(expected);
  });

  it('rejects an unknown RUN_MIGRATIONS value', () => {
    expect(() => parseEnv({ ...base, RUN_MIGRATIONS: 'yes' })).toThrow(/RUN_MIGRATIONS/);
  });

  it('throws a readable error when required secrets are missing', () => {
    expect(() => parseEnv({})).toThrow(/JWT_ACCESS_SECRET/);
  });
});
