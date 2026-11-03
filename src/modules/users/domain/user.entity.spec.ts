import { describe, expect, it } from 'vitest';

import { Email } from '#modules/shared/domain/value-objects/email.vo';

import { Role } from './role.vo.js';
import { User } from './user.entity.js';

const t0 = new Date('2026-01-01T00:00:00Z');
const make = (role = Role.user()) =>
  User.create({
    id: 'u1',
    email: Email.create('a@test.com'),
    passwordHash: 'h',
    role,
    createdAt: t0,
    updatedAt: t0,
  });

describe('User', () => {
  it('exposes its props', () => {
    const u = make();
    expect(u).toMatchObject({ id: 'u1', passwordHash: 'h', createdAt: t0, updatedAt: t0 });
    expect(u.email.value).toBe('a@test.com');
  });

  it('isAdmin reflects the role', () => {
    expect(make().isAdmin()).toBe(false);
    expect(make(Role.admin()).isAdmin()).toBe(true);
  });

  it('changeRole updates the role and updatedAt only', () => {
    const u = make();
    const t1 = new Date('2026-02-01T00:00:00Z');
    u.changeRole(Role.admin(), t1);
    expect(u.role.value).toBe('admin');
    expect(u.updatedAt).toEqual(t1);
    expect(u.createdAt).toEqual(t0);
  });
});
