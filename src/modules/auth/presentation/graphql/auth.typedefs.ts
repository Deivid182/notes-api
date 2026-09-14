export const authTypeDefs = /* GraphQL */ `
  type AuthPayload {
    accessToken: String!
    refreshToken: String!
    user: User!
  }

  type Query {
    me: User!
  }

  type Mutation {
    register(email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    refreshToken(refreshToken: String!): AuthPayload!
    logout: Boolean!
  }
`;
