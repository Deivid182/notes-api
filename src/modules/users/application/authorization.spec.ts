import { describe, expect, it } from 'vitest';

import { ForbiddenError } from '#modules/shared/domain/error';

import { assertCanViewUser, assertIsAdmin } from './authorization.js';

const user = { id: 'u1', role: 'user' };
const admin = { id: 'root', role: 'admin' };

describe('users authorization', () => {
  it('assertIsAdmin only allows admins', () => {
    expect(() => assertIsAdmin(admin)).not.toThrow();
    expect(() => assertIsAdmin(user)).toThrow(ForbiddenError);
  });

  it('assertCanViewUser allows self and admin only', () => {
    expect(() => assertCanViewUser('u1', user)).not.toThrow();
    expect(() => assertCanViewUser('u1', admin)).not.toThrow();
    expect(() => assertCanViewUser('u2', user)).toThrow(ForbiddenError);
  });
});
