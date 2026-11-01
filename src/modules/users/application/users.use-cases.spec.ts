import { describe, expect, it } from 'vitest';

import { ForbiddenError, NotFoundError } from '#modules/shared/domain/error';
import { Email } from '#modules/shared/domain/value-objects/email.vo';

import { Role } from '../domain/role.vo.js';
import { User } from '../domain/user.entity.js';

import { AssignRoleUseCase } from './assing-role.use-case.js';
import { GetUserUseCase } from './get-user.use-case.js';

import type { Actor } from '#modules/shared/domain/actor';
import type { UserRepository } from '../domain/user.repository.js';

class InMemoryUserRepository implements UserRepository {
  items = new Map<string, User>();
  async findById(id: string) {
    return this.items.get(id) ?? null;
  }
  async findByEmail(email: string) {
    return [...this.items.values()].find((u) => u.email.toString() === email) ?? null;
  }
  async save(user: User) {
    this.items.set(user.id, user);
  }
}

const at = new Date('2026-01-01T00:00:00Z');
const clock = { now: () => at };
const alice: Actor = { id: 'alice', role: 'user' };
const bob: Actor = { id: 'bob', role: 'user' };
const admin: Actor = { id: 'root', role: 'admin' };

async function setup() {
  const repo = new InMemoryUserRepository();
  await repo.save(
    User.create({
      id: 'alice',
      email: Email.create('alice@test.com'),
      passwordHash: 'x',
      role: Role.user(),
      createdAt: at,
      updatedAt: at,
    }),
  );
  return { repo, get: new GetUserUseCase(repo), assign: new AssignRoleUseCase(repo, clock) };
}

describe('GetUserUseCase', () => {
  it('lets a user read themselves and admin read anyone', async () => {
    const { get } = await setup();
    await expect(get.execute({ actor: alice, userId: 'alice' })).resolves.toBeDefined();
    await expect(get.execute({ actor: admin, userId: 'alice' })).resolves.toBeDefined();
  });

  it('forbids reading other users', async () => {
    const { get } = await setup();
    await expect(get.execute({ actor: bob, userId: 'alice' })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it('does not reveal whether an id exists to non-admins', async () => {
    const { get } = await setup();
    await expect(get.execute({ actor: bob, userId: 'ghost' })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(get.execute({ actor: admin, userId: 'ghost' })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe('AssignRoleUseCase', () => {
  it('forbids non-admins, even on themselves', async () => {
    const { assign, repo } = await setup();
    await expect(
      assign.execute({ actor: alice, userId: 'alice', role: 'admin' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(repo.items.get('alice')?.role.toString()).toBe('user');
  });

  it('lets admin change a role', async () => {
    const { assign } = await setup();
    const user = await assign.execute({ actor: admin, userId: 'alice', role: 'admin' });
    expect(user.role.toString()).toBe('admin');
  });

  it('throws NotFound for a missing user', async () => {
    const { assign } = await setup();
    await expect(
      assign.execute({ actor: admin, userId: 'ghost', role: 'user' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
