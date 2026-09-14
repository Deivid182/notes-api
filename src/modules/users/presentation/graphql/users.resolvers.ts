import { toGraphQLError } from '#core/presentation/graphql/helpers';

import { toUserDTO } from '../http/v1/dtos/users.dto.js';

import type { GraphQLContext } from '#core/presentation/graphql/context.js';

export const usersResolvers = {
  Query: {
    getUser: async (_parent: unknown, args: { id: string }, context: GraphQLContext) => {
      try {
        const { container } = context;
        const { getUser } = container.useCases;
        // return await getUser.execute(args.id);
        const user = await getUser.execute(args.id);
        if (!user) {
          throw new Error('User not found');
        }
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
      try {
        const { container } = context;
        const { createUser } = container.useCases;
        const user = await createUser.execute(args);
        return toUserDTO(user);
      } catch (e) {
        throw toGraphQLError(e);
      }
    },
  },
};
