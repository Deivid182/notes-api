import { requireAdmin, requireUser } from '#modules/shared/presentation/graphql/helpers';

import { mapUser } from '../mappers/user.mapper.js';

import type { GraphQLContext } from '#modules/shared/presentation/graphql/context';

// Los DomainError se traducen una sola vez en `maskError` (ver graphql/helpers.ts).
export const usersResolvers = {
  Query: {
    getUser: async (_parent: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const actor = requireUser(ctx);
      const user = await ctx.container.modules.users.useCases.getUser.execute({
        actor,
        userId: args.id,
      });
      return mapUser(user);
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
      return mapUser(user);
    },
  },
};
