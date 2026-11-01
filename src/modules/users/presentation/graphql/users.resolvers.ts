import {
  requireAdmin,
  requireUser,
  toGraphQLError,
} from '#modules/shared/presentation/graphql/helpers';

import { toUserDTO } from '../http/v1/dtos/users.dto.js';

import type { GraphQLContext } from '#modules/shared/presentation/graphql/context';

export const usersResolvers = {
  Query: {
    getUser: async (_parent: unknown, args: { id: string }, context: GraphQLContext) => {
      const actor = requireUser(context);
      try {
        const user = await context.container.useCases.getUser.execute({
          actor,
          userId: args.id,
        });
        return toUserDTO(user);
      } catch (e) {
        throw toGraphQLError(e);
      }
    },
  },
  Mutation: {
    createUser: async (
      _parent: unknown,
      args: { email: string; password: string; role?: string },
      context: GraphQLContext,
    ) => {
      requireAdmin(context);
      try {
        const user = await context.container.useCases.createUser.execute(args);
        return toUserDTO(user);
      } catch (e) {
        throw toGraphQLError(e);
      }
    },
  },
};
