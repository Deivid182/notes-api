import { describe, expect, it } from 'vitest';

import {
  ConflictError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from './error.js';

describe('domain errors', () => {
  it.each([
    [ValidationError, 'VALIDATION_ERROR'],
    [NotFoundError, 'NOT_FOUND'],
    [ConflictError, 'CONFLICT'],
    [UnauthorizedError, 'UNAUTHORIZED'],
    [ForbiddenError, 'FORBIDDEN'],
  ])('%o carries code %s and keeps its prototype chain', (Ctor, code) => {
    const err = new Ctor('boom');
    expect(err).toBeInstanceOf(Ctor);
    expect(err).toBeInstanceOf(DomainError);
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe(code);
    expect(err.message).toBe('boom');
    expect(err.name).toBe(Ctor.name);
  });
});
