import { describe, expect, it } from 'vitest';

import { Email } from '#modules/shared/domain/value-objects/email.vo';
import { connectSqlite } from '#modules/shared/infrastructure/persistence/sqlite/connection';
import { runSqliteMigrations } from '#modules/shared/infrastructure/persistence/sqlite/migrate';

import { Role } from '../../domain/role.vo.js';
import { User } from '../../domain/user.entity.js';

import { SqliteUserRepositoryImpl } from './sqlite-user.repository.impl.js';

const silent = { debug() {}, info() {}, warn() {}, error() {} };
const t0 = new Date('2026-01-01T00:00:00.000Z');

async function setup() {
  const db = connectSqlite(':memory:');
  await runSqliteMigrations(db, silent);
  return { db, repo: new SqliteUserRepositoryImpl(db) };
}

const make = (id: string, email: string, role = Role.user()) =>
  User.create({
    id,
    email: Email.create(email),
    passwordHash: 'hash',
    role,
    createdAt: t0,
    updatedAt: t0,
  });

describe('SqliteUserRepositoryImpl', () => {
  it('round-trips a user by id and by email', async () => {
    const { repo } = await setup();
    await repo.save(make('u1', 'a@test.com', Role.admin()));

    const byId = await repo.findById('u1');
    expect(byId).toMatchObject({ id: 'u1', passwordHash: 'hash' });
    expect(byId?.email.value).toBe('a@test.com');
    expect(byId?.role.value).toBe('admin');
    expect(byId?.createdAt).toEqual(t0);
    expect((await repo.findByEmail('a@test.com'))?.id).toBe('u1');
  });

  it('returns null when nothing matches', async () => {
    const { repo } = await setup();
    expect(await repo.findById('nope')).toBeNull();
    expect(await repo.findByEmail('nope@test.com')).toBeNull();
  });

  it('upserts by id (role change persists)', async () => {
    const { repo } = await setup();
    const user = make('u1', 'a@test.com');
    await repo.save(user);
    user.changeRole(Role.admin(), new Date('2026-02-01T00:00:00.000Z'));
    await repo.save(user);

    const stored = await repo.findById('u1');
    expect(stored?.role.value).toBe('admin');
    expect(stored?.updatedAt.toISOString()).toBe('2026-02-01T00:00:00.000Z');
  });

  it('rejects a second user with the same email', async () => {
    const { repo } = await setup();
    await repo.save(make('u1', 'a@test.com'));
    await expect(repo.save(make('u2', 'a@test.com'))).rejects.toThrow(/UNIQUE/);
  });
});
