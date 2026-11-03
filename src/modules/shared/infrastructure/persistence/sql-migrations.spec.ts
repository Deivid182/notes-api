import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runSqlMigrations, type MigrationStore } from './sql-migrations.js';

const logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };

function fakeStore(applied: string[] = [], failOn?: string) {
  const calls: string[] = [];
  const store: MigrationStore = {
    ensureTable: async () => {
      calls.push('ensure');
    },
    listApplied: async () => applied,
    apply: async (name) => {
      if (name === failOn) throw new Error('boom');
      calls.push(name);
    },
  };
  return { store, calls };
}

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'migrations-'));
  writeFileSync(join(dir, '002-b.sql'), 'SELECT 2;');
  writeFileSync(join(dir, '001-a.sql'), 'SELECT 1;');
  writeFileSync(join(dir, 'README.md'), 'not a migration');
  vi.clearAllMocks();
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('runSqlMigrations', () => {
  it('creates the table, then applies only .sql files in alphabetical order', async () => {
    const { store, calls } = fakeStore();
    await runSqlMigrations({ engine: 'x', dir, store, logger });
    expect(calls).toEqual(['ensure', '001-a.sql', '002-b.sql']);
    expect(logger.info).toHaveBeenCalledWith('x migration applied: 001-a.sql');
  });

  it('skips migrations that are already applied', async () => {
    const { store, calls } = fakeStore(['001-a.sql']);
    await runSqlMigrations({ engine: 'x', dir, store, logger });
    expect(calls).toEqual(['ensure', '002-b.sql']);
  });

  it('does nothing when everything is applied', async () => {
    const { store, calls } = fakeStore(['001-a.sql', '002-b.sql']);
    await runSqlMigrations({ engine: 'x', dir, store, logger });
    expect(calls).toEqual(['ensure']);
  });

  it('logs and rethrows a failure, stopping before the next file', async () => {
    const { store, calls } = fakeStore([], '001-a.sql');
    await expect(runSqlMigrations({ engine: 'x', dir, store, logger })).rejects.toThrow('boom');
    expect(calls).toEqual(['ensure']);
    expect(logger.error).toHaveBeenCalledWith('x migration failed: 001-a.sql', {
      message: 'boom',
    });
  });
});
