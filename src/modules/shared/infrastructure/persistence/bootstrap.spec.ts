import { describe, expect, it, vi } from 'vitest';

import { parseEnv } from '../config/env.js';

import { bootstrapPersistence } from './bootstrap.js';

const logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const base = {
  JWT_ACCESS_SECRET: 'a',
  JWT_REFRESH_SECRET: 'b',
  DATABASE_ENGINE: 'sqlite',
  DATABASE_URL: ':memory:',
};

describe('bootstrapPersistence (sqlite)', () => {
  it('connects without migrating when RUN_MIGRATIONS is off', async () => {
    const { persistence, shutdown } = await bootstrapPersistence(parseEnv(base), logger);
    expect(persistence.engine).toBe('sqlite');
    if (persistence.engine !== 'sqlite') throw new Error('unreachable');
    const rows = persistence.sqlite
      .prepare("SELECT name FROM sqlite_master WHERE name = 'users'")
      .all();
    expect(rows).toHaveLength(0);
    await shutdown();
  });

  it('runs migrations when RUN_MIGRATIONS is on, and shutdown closes the db', async () => {
    const { persistence, shutdown } = await bootstrapPersistence(
      parseEnv({ ...base, RUN_MIGRATIONS: 'true' }),
      logger,
    );
    if (persistence.engine !== 'sqlite') throw new Error('unreachable');
    expect(
      persistence.sqlite.prepare("SELECT name FROM sqlite_master WHERE name = 'users'").all(),
    ).toHaveLength(1);
    await shutdown();
    expect(() => persistence.sqlite.prepare('SELECT 1')).toThrow();
  });
});
