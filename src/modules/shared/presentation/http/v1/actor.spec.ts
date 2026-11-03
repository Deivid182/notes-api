import { describe, expect, it } from 'vitest';

import { UnauthorizedError } from '#modules/shared/domain/error';

import { actorOf } from './actor.js';

import type { Request } from 'express';

describe('actorOf', () => {
  it('returns the authenticated user', () => {
    expect(actorOf({ user: { id: 'u', role: 'user' } } as Request)).toEqual({
      id: 'u',
      role: 'user',
    });
  });

  it('throws when the request is anonymous', () => {
    expect(() => actorOf({} as Request)).toThrow(UnauthorizedError);
  });
});
