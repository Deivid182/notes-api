import { describe, expect, it } from 'vitest';

import { mapAuthPayload } from '#modules/auth/presentation/mappers/auth.mapper';
import { Email } from '#modules/shared/domain/value-objects/email.vo';

import { Role } from '../../domain/role.vo.js';
import { User } from '../../domain/user.entity.js';

import { mapUser } from './user.mapper.js';

const user = User.create({
  id: 'u1',
  email: Email.create('a@test.com'),
  passwordHash: 'secret-hash',
  role: Role.admin(),
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-02T00:00:00Z'),
});

describe('mapUser', () => {
  it('maps to plain serialisable fields and never leaks the password hash', () => {
    const mapped = mapUser(user);
    expect(mapped).toEqual({
      id: 'u1',
      email: 'a@test.com',
      role: 'admin',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    });
    expect(JSON.stringify(mapped)).not.toContain('secret-hash');
  });
});

describe('mapAuthPayload', () => {
  it('combines the tokens with the mapped user', () => {
    expect(mapAuthPayload(user, 'acc', 'ref')).toEqual({
      accessToken: 'acc',
      refreshToken: 'ref',
      user: mapUser(user),
    });
  });
});
