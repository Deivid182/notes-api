import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { connectSqlite } from './connection.js';
import { runSqliteMigrations } from './migrate.js';

const logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const tables = (db: ReturnType<typeof connectSqlite>) =>
  (
    db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all() as Array<{
      name: string;
    }>
  ).map((r) => r.name);

let tmp: string | undefined;
afterEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  tmp = undefined;
});

describe('connectSqlite', () => {
  it('opens an in-memory database with foreign keys on', () => {
    const db = connectSqlite(':memory:');
    expect((db.prepare('PRAGMA foreign_keys').get() as { foreign_keys: number }).foreign_keys).toBe(
      1,
    );
    db.close();
  });

  it('creates missing parent folders for file databases and enables WAL', () => {
    tmp = mkdtempSync(join(tmpdir(), 'sqlite-'));
    const file = join(tmp, 'nested', 'dir', 'test.db');
    const db = connectSqlite(file);
    expect(existsSync(file)).toBe(true);
    expect((db.prepare('PRAGMA journal_mode').get() as { journal_mode: string }).journal_mode).toBe(
      'wal',
    );
    db.close();
  });
});

describe('runSqliteMigrations', () => {
  it('creates the schema and records the migration', async () => {
    const db = connectSqlite(':memory:');
    await runSqliteMigrations(db, logger);
    expect(tables(db)).toEqual(
      expect.arrayContaining(['_migrations', 'notes', 'refresh_tokens', 'users']),
    );
    expect(db.prepare('SELECT name FROM _migrations').all()).toEqual([{ name: '001-init.sql' }]);
    db.close();
  });

  it('is idempotent', async () => {
    const db = connectSqlite(':memory:');
    await runSqliteMigrations(db, logger);
    await runSqliteMigrations(db, logger);
    expect(db.prepare('SELECT COUNT(*) AS n FROM _migrations').get()).toEqual({ n: 1 });
    db.close();
  });

  it('enforces unique emails and cascades note deletion with the user', async () => {
    const db = connectSqlite(':memory:');
    await runSqliteMigrations(db, logger);
    const ins = db.prepare(
      "INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?, ?, 'h', 'user', 'x', 'x')",
    );
    ins.run('u1', 'a@test.com');
    expect(() => ins.run('u2', 'a@test.com')).toThrow(/UNIQUE/);

    db.prepare(
      "INSERT INTO notes (id, owner_id, title, content, created_at, updated_at) VALUES ('n1', 'u1', 't', 'c', 'x', 'x')",
    ).run();
    db.prepare("DELETE FROM users WHERE id = 'u1'").run();
    expect(db.prepare('SELECT COUNT(*) AS n FROM notes').get()).toEqual({ n: 0 });
    db.close();
  });
});

describe('runSqliteMigrations rollback', () => {
  it('rolls back a failing migration entirely and does not record it', async () => {
    tmp = mkdtempSync(join(tmpdir(), 'sqlite-mig-'));
    writeFileSync(join(tmp, '001-bad.sql'), 'CREATE TABLE half_done (id TEXT); THIS IS NOT SQL;');
    const db = connectSqlite(':memory:');

    await expect(runSqliteMigrations(db, logger, tmp)).rejects.toThrow();

    expect(tables(db)).not.toContain('half_done');
    expect(db.prepare('SELECT COUNT(*) AS n FROM _migrations').get()).toEqual({ n: 0 });
    expect(logger.error).toHaveBeenCalledWith(
      'sqlite migration failed: 001-bad.sql',
      expect.objectContaining({ message: expect.any(String) }),
    );
    db.close();
  });

  it('applies later migrations on the next run once the bad one is fixed', async () => {
    tmp = mkdtempSync(join(tmpdir(), 'sqlite-mig-'));
    writeFileSync(join(tmp, '001-a.sql'), 'CREATE TABLE a (id TEXT);');
    const db = connectSqlite(':memory:');
    await runSqliteMigrations(db, logger, tmp);
    writeFileSync(join(tmp, '002-b.sql'), 'CREATE TABLE b (id TEXT);');
    await runSqliteMigrations(db, logger, tmp);
    expect(tables(db)).toEqual(expect.arrayContaining(['a', 'b']));
    db.close();
  });
});
