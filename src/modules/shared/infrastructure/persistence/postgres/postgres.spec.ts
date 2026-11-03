import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { connectPostgres } from './connection.js';
import { runPostgresMigrations } from './migrate.js';

import type { Pool } from 'pg';

const logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };

describe('connectPostgres', () => {
  it('logs idle client errors instead of crashing the process', async () => {
    const pool = connectPostgres('postgres://u:p@localhost:1/db', logger, {
      max: 3,
      connectionTimeoutMillis: 100,
    });
    expect(pool.options.max).toBe(3);
    expect(pool.options.connectionTimeoutMillis).toBe(100);

    expect(() => pool.emit('error', new Error('connection reset'))).not.toThrow();
    expect(logger.error).toHaveBeenCalledWith('postgres idle client error', {
      message: 'connection reset',
    });
    await pool.end();
  });
});

describe('runPostgresMigrations', () => {
  let tmp: string | undefined;
  afterEach(() => {
    if (tmp) rmSync(tmp, { recursive: true, force: true });
    tmp = undefined;
  });

  function fakePool(failOn?: string) {
    const executed: string[] = [];
    const client = {
      query: vi.fn(async (sql: string) => {
        executed.push(sql.trim().split('\n')[0] ?? '');
        if (failOn && sql.includes(failOn)) throw new Error('syntax error');
        return { rows: [] };
      }),
      release: vi.fn(),
    };
    const pool = {
      query: vi.fn(async (sql: string) => {
        executed.push(sql.trim().split('\n')[0] ?? '');
        return { rows: [] };
      }),
      connect: vi.fn(async () => client),
    } as unknown as Pool;
    return { pool, client, executed };
  }

  it('applies each file in a transaction and records it', async () => {
    tmp = mkdtempSync(join(tmpdir(), 'pg-mig-'));
    writeFileSync(join(tmp, '001-a.sql'), 'CREATE TABLE a (id TEXT);');
    const { pool, client } = fakePool();

    await runPostgresMigrations(pool, logger, tmp);

    const sqls = client.query.mock.calls.map((c) => c[0] as string);
    expect(sqls[0]).toBe('BEGIN');
    expect(sqls[1]).toContain('CREATE TABLE a');
    expect(sqls[2]).toContain('INSERT INTO _migrations');
    expect(sqls[3]).toBe('COMMIT');
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it('rolls back, releases the client and rethrows when a migration fails', async () => {
    tmp = mkdtempSync(join(tmpdir(), 'pg-mig-'));
    writeFileSync(join(tmp, '001-bad.sql'), 'BROKEN STATEMENT;');
    const { pool, client } = fakePool('BROKEN');

    await expect(runPostgresMigrations(pool, logger, tmp)).rejects.toThrow('syntax error');

    const sqls = client.query.mock.calls.map((c) => c[0] as string);
    expect(sqls).toContain('ROLLBACK');
    expect(sqls).not.toContain('COMMIT');
    expect(client.release).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith('postgres migration failed: 001-bad.sql', {
      message: 'syntax error',
    });
  });
});
