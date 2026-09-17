import { GraphQLError } from 'graphql';

import { DomainError } from '#modules/shared/domain/error';

import type { AuthUser, GraphQLContext } from './context.js';

const CODE_MAP: Record<string, string> = {
  VALIDATION_ERROR: 'BAD_USER_INPUT',
  UNAUTHORIZED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
};

export function requireUser(ctx: GraphQLContext): AuthUser {
  if (!ctx.user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return ctx.user;
}

export function toGraphQLError(err: unknown): GraphQLError {
  if (err instanceof DomainError) {
    return new GraphQLError(err.message, {
      extensions: { code: CODE_MAP[err.code] ?? 'INTERNAL_SERVER_ERROR' },
    });
  }
  if (err instanceof GraphQLError) return err;

  return new GraphQLError('Internal server error', {
    extensions: { code: 'INTERNAL_SERVER_ERROR' },
  });
}
