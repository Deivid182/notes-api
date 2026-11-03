import { type GraphQLContext } from '#modules/shared/presentation/graphql/context';
import { requireUser } from '#modules/shared/presentation/graphql/helpers';
import { mapUser } from '#modules/users/presentation/mappers/user.mapper';

import { mapAuthPayload } from '../mappers/auth.mapper.js';

// Los DomainError se traducen una sola vez en `maskError` (ver graphql/helpers.ts).
export const authResolvers = {
  Query: {
    me: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const actor = requireUser(ctx);
      const user = await ctx.container.modules.users.useCases.getUser.execute({
        actor,
        userId: actor.id,
      });
      return mapUser(user);
    },
  },
  Mutation: {
    register: async (
      _: unknown,
      args: { email: string; password: string },
      ctx: GraphQLContext,
    ) => {
      const r = await ctx.container.modules.auth.useCases.registerUser.execute(args);
      return mapAuthPayload(r.user, r.accessToken, r.refreshToken);
    },
    login: async (_: unknown, args: { email: string; password: string }, ctx: GraphQLContext) => {
      const r = await ctx.container.modules.auth.useCases.login.execute(args);
      return mapAuthPayload(r.user, r.accessToken, r.refreshToken);
    },
    refreshToken: async (_: unknown, args: { refreshToken: string }, ctx: GraphQLContext) => {
      const r = await ctx.container.modules.auth.useCases.refreshToken.execute(args);
      return mapAuthPayload(r.user, r.accessToken, r.refreshToken);
    },
    logout: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const user = requireUser(ctx);
      await ctx.container.modules.auth.useCases.logout.execute({ userId: user.id, all: true });
      return true;
    },
  },
};
