import { responseTypeDef } from '#modules/shared/presentation/graphql/response';

export const authTypeDefs = /* GraphQL */ `
  type AuthPayload {
    accessToken: String!
    refreshToken: String!
    user: User!
  }

  ${responseTypeDef('AuthPayloadResponse', 'AuthPayload')}

  type Query {
    me: UserResponse!
  }

  type Mutation {
    register(email: String!, password: String!): AuthPayloadResponse!
    login(email: String!, password: String!): AuthPayloadResponse!
    refreshToken(refreshToken: String!): AuthPayloadResponse!
    logout: EmptyResponse!
  }
`;
