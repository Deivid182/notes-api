// import { authResolvers } from '../../modules/auth/presentation/graphql/auth.resolvers.js';
// import { authTypeDefs } from '../../modules/auth/presentation/graphql/auth.typeDefs.js';
// import { notesResolvers } from '../../modules/notes/presentation/graphql/notes.resolvers.js';
// import { notesTypeDefs } from '../../modules/notes/presentation/graphql/notes.typeDefs.js';
// import { usersResolvers } from '../../modules/users/presentation/graphql/users.resolvers.js';
import { createSchema } from 'graphql-yoga';

import { usersResolvers } from '#modules/users/presentation/graphql/users.resolvers';
import { usersTypeDefs } from '#modules/users/presentation/graphql/users.typedefs';

export const typeDefs = /* GraphQL */ `
  ${usersTypeDefs}
`;

export const resolvers = {
  Query: {
    ...usersResolvers.Query,
    // ...notesResolvers.Query,
  },
  Mutation: {
    // ...authResolvers.Mutation,
    // ...notesResolvers.Mutation,
    ...usersResolvers.Mutation,
  },
};

export const schema = createSchema({
  typeDefs,
  resolvers,
});
