import { GraphQLError } from 'graphql';

import { DomainError } from '#modules/shared/domain/error';

import { errorExtensions } from './response.js';

import type { Actor } from '#modules/shared/domain/actor';
import type { Logger } from '#modules/shared/domain/interfaces/logger.interface';
import type { MaskError } from 'graphql-yoga';

/** Subconjunto del contexto GraphQL que necesitan los guards (el contexto completo vive en `src/presentation`). */
export interface AuthContext {
  user: Actor | null;
}

export function requireUser(ctx: AuthContext): Actor {
  if (!ctx.user) {
    throw new GraphQLError('Authentication required', {
      extensions: errorExtensions('UNAUTHORIZED'),
    });
  }
  return ctx.user;
}

export function requireAdmin(ctx: AuthContext): Actor {
  const user = requireUser(ctx);
  if (user.role !== 'admin') {
    throw new GraphQLError('Admin role required', {
      extensions: errorExtensions('FORBIDDEN'),
    });
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
        extensions: errorExtensions(original.code),
      });
    }

    // GraphQLError con código propio (p. ej. `requireUser`): se completa con el envoltorio estándar.
    if (original instanceof GraphQLError) {
      const code = original.extensions.code;
      if (typeof code !== 'string') return located ?? original;
      return new GraphQLError(original.message, {
        ...position,
        originalError: original,
        extensions: { ...errorExtensions(code), ...original.extensions },
      });
    }

    logger.error('Unhandled GraphQL error', {
      message: original instanceof Error ? original.message : String(original),
      stack: original instanceof Error ? original.stack : undefined,
    });
    return new GraphQLError('Internal server error', {
      ...position,
      extensions: errorExtensions('INTERNAL_ERROR'),
    });
  };
}
