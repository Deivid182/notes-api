import { type GraphQLContext } from '#app/presentation/graphql/context';
import { requireUser } from '#modules/shared/presentation/graphql/helpers';
import { gqlResponse } from '#modules/shared/presentation/graphql/response';
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
      return gqlResponse({ data: mapUser(user), message: 'User retrieved' });
    },
  },
  Mutation: {
    register: async (
      _: unknown,
      args: { email: string; password: string },
      ctx: GraphQLContext,
    ) => {
      const r = await ctx.container.modules.auth.useCases.registerUser.execute(args);
      return gqlResponse({
        data: mapAuthPayload(r.user, r.accessToken, r.refreshToken),
        message: 'User registered',
        statusCode: 201,
      });
    },
    login: async (_: unknown, args: { email: string; password: string }, ctx: GraphQLContext) => {
      const r = await ctx.container.modules.auth.useCases.login.execute(args);
      return gqlResponse({
        data: mapAuthPayload(r.user, r.accessToken, r.refreshToken),
        message: 'Login successful',
      });
    },
    refreshToken: async (_: unknown, args: { refreshToken: string }, ctx: GraphQLContext) => {
      const r = await ctx.container.modules.auth.useCases.refreshToken.execute(args);
      return gqlResponse({
        data: mapAuthPayload(r.user, r.accessToken, r.refreshToken),
        message: 'Token refreshed',
      });
    },
    logout: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const user = requireUser(ctx);
      await ctx.container.modules.auth.useCases.logout.execute({ userId: user.id, all: true });
      return gqlResponse({ data: null, message: 'Logged out' });
    },
  },
};
