import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildContainer } from '#app/container';
import { newUuid } from '#modules/shared/domain/uuid';
import { Email } from '#modules/shared/domain/value-objects/email.vo';
import { parseEnv } from '#modules/shared/infrastructure/config/env';
import { bootstrapPersistence } from '#modules/shared/infrastructure/persistence/bootstrap';
import { buildSharedContext } from '#modules/shared/infrastructure/shared-context';
import { Role } from '#modules/users/domain/role.vo';
import { User } from '#modules/users/domain/user.entity';

import { createTestDatabase, testEngine, type TestDatabase } from '../support/test-database.js';

const silent = { debug() {}, info() {}, warn() {}, error() {} };

describe(`persistence (${testEngine})`, () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await createTestDatabase();
  });
  afterAll(() => db.drop());

  const open = () =>
    bootstrapPersistence(parseEnv({ ...process.env, ...db.env, RUN_MIGRATIONS: 'true' }), silent);

  it('runs migrations twice without failing (idempotent)', async () => {
    await (await open()).shutdown();
    await (await open()).shutdown();
  });

  it('round-trips a user and enforces unique emails at the database level', async () => {
    const handle = await open();
    try {
      const shared = buildSharedContext({
        env: parseEnv({ ...process.env, ...db.env }),
        persistence: handle.persistence,
        logger: silent,
      });
      const repo = buildContainer({ shared }).modules.users.userRepository;

      const now = new Date('2026-01-02T03:04:05.000Z');
      const make = (id: string, email: string) =>
        User.create({
          id,
          email: Email.create(email),
          passwordHash: 'hash',
          role: Role.user(),
          createdAt: now,
          updatedAt: now,
        });

      const id = newUuid();
      await repo.save(make(id, 'dup@test.com'));

      const byId = await repo.findById(id);
      expect(byId?.email.value).toBe('dup@test.com');
      expect(byId?.role.value).toBe('user');
      expect(byId?.createdAt.toISOString()).toBe(now.toISOString());
      expect((await repo.findByEmail('dup@test.com'))?.id).toBe(id);
      expect(await repo.findById(newUuid())).toBeNull();

      await expect(repo.save(make(newUuid(), 'dup@test.com'))).rejects.toThrow();
    } finally {
      await handle.shutdown();
    }
  });
});
