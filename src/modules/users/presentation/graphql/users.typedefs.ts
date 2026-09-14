export const usersTypeDefs = `
  type User {
    id: ID!
    email: String!
    role: String!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    getUser(id: ID!): User!
  }

  type Mutation {
    createUser(email: String!, password: String!, role: String): User!
  }
`;
