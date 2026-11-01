export const notesTypeDefs = /* GraphQL */ `
  type Note {
    id: ID!
    ownerId: ID!
    title: String!
    content: String!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    notes: [Note!]!
    note(id: ID!): Note!
  }

  type Mutation {
    createNote(title: String!, content: String): Note!
    updateNote(id: ID!, title: String, content: String): Note!
    deleteNote(id: ID!): Boolean!
  }
`;
