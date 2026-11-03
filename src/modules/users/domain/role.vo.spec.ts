import { describe, expect, it } from 'vitest';

import { ValidationError } from '#modules/shared/domain/error';

import { Role } from './role.vo.js';

describe('Role', () => {
  it('creates only known roles', () => {
    expect(Role.create('admin').isAdmin()).toBe(true);
    expect(Role.create('user').isAdmin()).toBe(false);
    expect(() => Role.create('root')).toThrow(ValidationError);
  });

  it('compares by value', () => {
    expect(Role.user().equals(Role.create('user'))).toBe(true);
    expect(Role.user().equals(Role.admin())).toBe(false);
  });

  it('restore does not validate against the current role list', () => {
    expect(Role.restore('legacy').value).toBe('legacy');
    expect(Role.restore('legacy').isAdmin()).toBe(false);
  });
});
