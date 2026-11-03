import { describe, expect, it } from 'vitest';

import { connectSqlite } from '#modules/shared/infrastructure/persistence/sqlite/connection';
import { runSqliteMigrations } from '#modules/shared/infrastructure/persistence/sqlite/migrate';

import { RefreshToken } from '../../../domain/refresh-token.entity.js';

import { SqliteRefreshTokenRepositoryImpl } from './sqlite-refresh-token.repository.impl.js';

const silent = { debug() {}, info() {}, warn() {}, error() {} };
const expiresAt = new Date('2027-01-01T00:00:00.000Z');

async function setup() {
  const db = connectSqlite(':memory:');
  await runSqliteMigrations(db, silent);
  for (const id of ['u1', 'u2']) {
    db.prepare(
      "INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?, ?, 'h', 'user', 'x', 'x')",
    ).run(id, `${id}@test.com`);
  }
  return new SqliteRefreshTokenRepositoryImpl(db);
}

const make = (id: string, userId: string) =>
  RefreshToken.create({ id, userId, tokenHash: `hash-${id}`, expiresAt, revokedAt: null });

describe('SqliteRefreshTokenRepositoryImpl', () => {
  it('round-trips a token and returns null for unknown ids', async () => {
    const repo = await setup();
    await repo.save(make('j1', 'u1'));
    const stored = await repo.findById('j1');
    expect(stored).toMatchObject({ id: 'j1', userId: 'u1', tokenHash: 'hash-j1' });
    expect(stored?.expiresAt).toEqual(expiresAt);
    expect(stored?.revokedAt).toBeNull();
    expect(await repo.findById('nope')).toBeNull();
  });

  it('persists revocation through save (upsert)', async () => {
    const repo = await setup();
    const token = make('j1', 'u1');
    await repo.save(token);
    const at = new Date('2026-06-01T00:00:00.000Z');
    token.revoke(at);
    await repo.save(token);
    expect((await repo.findById('j1'))?.revokedAt).toEqual(at);
  });

  it('revokeAllForUser revokes only that user and keeps earlier revocations', async () => {
    const repo = await setup();
    const early = new Date('2026-01-01T00:00:00.000Z');
    const late = new Date('2026-06-01T00:00:00.000Z');
    const already = make('j1', 'u1');
    already.revoke(early);
    await repo.save(already);
    await repo.save(make('j2', 'u1'));
    await repo.save(make('j3', 'u2'));

    await repo.revokeAllForUser('u1', late);

    expect((await repo.findById('j1'))?.revokedAt).toEqual(early);
    expect((await repo.findById('j2'))?.revokedAt).toEqual(late);
    expect((await repo.findById('j3'))?.revokedAt).toBeNull();
  });
});
