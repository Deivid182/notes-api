import { describe, expect, it } from 'vitest';

import { ValidationError } from '#modules/shared/domain/error';

import { Role } from './role.vo.js';

describe('Role', () => {
  it('creates only known roles', () => {
    expect(Role.create('admin').isAdmin()).toBe(true);
    expect(Role.create('user').isAdmin()).toBe(false);
    expect(() => Role.create('root')).toThrow(ValidationError);
  });

  it('restore does not validate against the current role list', () => {
    expect(Role.restore('legacy').toString()).toBe('legacy');
    expect(Role.restore('legacy').isAdmin()).toBe(false);
  });
});
