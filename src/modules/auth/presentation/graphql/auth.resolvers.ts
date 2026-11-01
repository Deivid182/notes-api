import { type GraphQLContext } from '#modules/shared/presentation/graphql/context';
import { requireUser } from '#modules/shared/presentation/graphql/helpers';
import { toUserDTO } from '#modules/users/presentation/dto/users.dto';

import { toAuthPayload } from '../dto/auth.dto.js';

// Los DomainError se traducen una sola vez en `maskError` (ver graphql/helpers.ts).
export const authResolvers = {
  Query: {
    me: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const actor = requireUser(ctx);
      const user = await ctx.container.modules.users.useCases.getUser.execute({
        actor,
        userId: actor.id,
      });
      return toUserDTO(user);
    },
  },
  Mutation: {
    register: async (
      _: unknown,
      args: { email: string; password: string },
      ctx: GraphQLContext,
    ) => {
      const r = await ctx.container.modules.auth.useCases.registerUser.execute(args);
      return toAuthPayload(r.user, r.accessToken, r.refreshToken);
    },
    login: async (_: unknown, args: { email: string; password: string }, ctx: GraphQLContext) => {
      const r = await ctx.container.modules.auth.useCases.login.execute(args);
      return toAuthPayload(r.user, r.accessToken, r.refreshToken);
    },
    refreshToken: async (_: unknown, args: { refreshToken: string }, ctx: GraphQLContext) => {
      const r = await ctx.container.modules.auth.useCases.refreshToken.execute(args);
      return toAuthPayload(r.user, r.accessToken, r.refreshToken);
    },
    logout: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const user = requireUser(ctx);
      await ctx.container.modules.auth.useCases.logout.execute({ userId: user.id, all: true });
      return true;
    },
  },
};
