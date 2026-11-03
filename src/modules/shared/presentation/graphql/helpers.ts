import { GraphQLError } from 'graphql';

import { DomainError } from '#modules/shared/domain/error';

import type { Logger } from '#modules/shared/domain/interfaces/logger.interface';
import type { AuthUser, GraphQLContext } from './context.js';
import type { MaskError } from 'graphql-yoga';

export function requireUser(ctx: GraphQLContext): AuthUser {
  if (!ctx.user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHORIZED' },
    });
  }
  return ctx.user;
}

export function requireAdmin(ctx: GraphQLContext): AuthUser {
  const user = requireUser(ctx);
  if (user.role !== 'admin') {
    throw new GraphQLError('Admin role required', { extensions: { code: 'FORBIDDEN' } });
  }
  return user;
}

/**
 * `maskError` de Yoga: único punto donde un `DomainError` se traduce a `GraphQLError`.
 * El `extensions.code` es el mismo `DomainError.code` que usa HTTP (`error.code`). Los resolvers solo lanzan; lo inesperado se registra y se oculta al cliente.
 */
export function createMaskError(logger: Logger): MaskError {
  return (error) => {
    const located = error instanceof GraphQLError ? error : undefined;
    const original = located?.originalError ?? error;
    const position = { nodes: located?.nodes, path: located?.path };

    if (original instanceof DomainError) {
      return new GraphQLError(original.message, {
        ...position,
        originalError: original,
        extensions: { code: original.code },
      });
    }

    // Ya es un GraphQLError con su código (p. ej. `requireUser`): se entrega tal cual.
    if (original instanceof GraphQLError) return located ?? original;

    logger.error('Unhandled GraphQL error', {
      message: original instanceof Error ? original.message : String(original),
      stack: original instanceof Error ? original.stack : undefined,
    });
    return new GraphQLError('Internal server error', {
      ...position,
      extensions: { code: 'INTERNAL_ERROR' },
    });
  };
}
