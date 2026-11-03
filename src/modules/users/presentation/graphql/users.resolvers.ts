import { requireAdmin, requireUser } from '#modules/shared/presentation/graphql/helpers';
import { gqlResponse } from '#modules/shared/presentation/graphql/response';

import { mapUser } from '../mappers/user.mapper.js';

import type { GraphQLContext } from '#app/presentation/graphql/context';

// Los DomainError se traducen una sola vez en `maskError` (ver graphql/helpers.ts).
export const usersResolvers = {
  Query: {
    getUser: async (_parent: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const actor = requireUser(ctx);
      const user = await ctx.container.modules.users.useCases.getUser.execute({
        actor,
        userId: args.id,
      });
      return gqlResponse({ data: mapUser(user), message: 'User retrieved' });
    },
  },
  Mutation: {
    createUser: async (
      _parent: unknown,
      args: { email: string; password: string; role?: string },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      const user = await ctx.container.modules.users.useCases.createUser.execute(args);
      return gqlResponse({ data: mapUser(user), message: 'User created', statusCode: 201 });
    },
  },
};
