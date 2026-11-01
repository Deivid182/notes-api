import { GraphQLError } from 'graphql';
import { describe, expect, it, vi } from 'vitest';

import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '#modules/shared/domain/error';

import { createMaskError } from './helpers.js';

const logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const mask = createMaskError(logger);

describe('createMaskError', () => {
  it.each([
    [new ValidationError('bad'), 'BAD_USER_INPUT'],
    [new ForbiddenError('no'), 'FORBIDDEN'],
    [new NotFoundError('missing'), 'NOT_FOUND'],
    [new ConflictError('dup'), 'CONFLICT'],
  ])('maps %s to %s', (err, code) => {
    const masked = mask(err, 'ignored') as GraphQLError;
    expect(masked.message).toBe(err.message);
    expect(masked.extensions.code).toBe(code);
  });

  it('unwraps a DomainError located by graphql-js and keeps its path', () => {
    const located = new GraphQLError('x', {
      path: ['note'],
      originalError: new NotFoundError('Note not found'),
    });
    const masked = mask(located, 'ignored') as GraphQLError;
    expect(masked.message).toBe('Note not found');
    expect(masked.extensions.code).toBe('NOT_FOUND');
    expect(masked.path).toEqual(['note']);
  });

  it('passes through GraphQLErrors that already carry a code', () => {
    const own = new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
    const located = new GraphQLError('x', { path: ['me'], originalError: own });
    const masked = mask(located, 'ignored') as GraphQLError;
    expect(masked.extensions.code).toBe('UNAUTHENTICATED');
    expect(masked.path).toEqual(['me']);
  });

  it('hides and logs unexpected errors', () => {
    const masked = mask(new Error('db password leaked'), 'ignored') as GraphQLError;
    expect(masked.message).toBe('Internal server error');
    expect(masked.extensions.code).toBe('INTERNAL_SERVER_ERROR');
    expect(logger.error).toHaveBeenCalledWith(
      'Unhandled GraphQL error',
      expect.objectContaining({ message: 'db password leaked' }),
    );
  });
});
