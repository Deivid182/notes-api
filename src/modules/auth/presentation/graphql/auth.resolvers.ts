import { type GraphQLContext } from '#modules/shared/presentation/graphql/context';
import { toGraphQLError, requireUser } from '#modules/shared/presentation/graphql/helpers';
import { toUserDTO } from '#modules/users/presentation/http/v1/dtos/users.dto';

export const authResolvers = {
  Mutation: {
    register: async (
      _: unknown,
      args: { email: string; password: string },
      ctx: GraphQLContext,
    ) => {
      try {
        const r = await ctx.container.useCases.registerUser.execute(args);
        return {
          accessToken: r.accessToken,
          refreshToken: r.refreshToken,
          user: toUserDTO(r.user),
        };
      } catch (e) {
        throw toGraphQLError(e);
      }
    },
    login: async (_: unknown, args: { email: string; password: string }, ctx: GraphQLContext) => {
      try {
        const r = await ctx.container.useCases.login.execute(args);
        return {
          accessToken: r.accessToken,
          refreshToken: r.refreshToken,
          user: toUserDTO(r.user),
        };
      } catch (e) {
        throw toGraphQLError(e);
      }
    },
    refreshToken: async (_: unknown, args: { refreshToken: string }, ctx: GraphQLContext) => {
      try {
        const r = await ctx.container.useCases.refreshToken.execute(args);
        return {
          accessToken: r.accessToken,
          refreshToken: r.refreshToken,
          user: toUserDTO(r.user),
        };
      } catch (e) {
        throw toGraphQLError(e);
      }
    },
    logout: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const user = requireUser(ctx);
      try {
        await ctx.container.useCases.logout.execute({ userId: user.id, all: true });
        return true;
      } catch (e) {
        throw toGraphQLError(e);
      }
    },
  },
};
