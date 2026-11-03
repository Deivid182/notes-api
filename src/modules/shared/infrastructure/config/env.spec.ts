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

  it('defaults DATABASE_URL to a local file only for sqlite', () => {
    expect(parseEnv(base).DATABASE_URL).toBe('./data/notes.db');
    expect(() => parseEnv({ ...base, DATABASE_ENGINE: 'postgres' })).toThrow(/DATABASE_URL/);
    expect(
      parseEnv({ ...base, DATABASE_ENGINE: 'postgres', DATABASE_URL: 'postgres://x' }).DATABASE_URL,
    ).toBe('postgres://x');
  });

  it('validates ports and token durations', () => {
    expect(() => parseEnv({ ...base, PORT_HTTP: '70000' })).toThrow(/PORT_HTTP/);
    expect(() => parseEnv({ ...base, PORT_HTTP: '3.5' })).toThrow(/PORT_HTTP/);
    expect(() => parseEnv({ ...base, JWT_ACCESS_EXPIRES_IN: 'soon' })).toThrow(
      /JWT_ACCESS_EXPIRES_IN/,
    );
    expect(parseEnv({ ...base, JWT_ACCESS_EXPIRES_IN: '15m' }).JWT_ACCESS_EXPIRES_IN).toBe('15m');
  });

  it('throws a readable error when required secrets are missing', () => {
    expect(() => parseEnv({})).toThrow(/JWT_ACCESS_SECRET/);
  });
});
