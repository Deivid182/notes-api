import { responseTypeDef } from '#modules/shared/presentation/graphql/response';

export const usersTypeDefs = /* GraphQL */ `
  type User {
    id: ID!
    email: String!
    role: String!
    createdAt: String!
    updatedAt: String!
  }

  ${responseTypeDef('UserResponse', 'User')}

  type Query {
    getUser(id: ID!): UserResponse!
  }

  type Mutation {
    createUser(email: String!, password: String!, role: String): UserResponse!
  }
`;
