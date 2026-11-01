export const notesTypeDefs = /* GraphQL */ `
  type Note {
    id: ID!
    ownerId: ID!
    title: String!
    content: String!
    createdAt: String!
    updatedAt: String!
  }

  type NotePage {
    items: [Note!]!
    limit: Int!
    offset: Int!
    hasMore: Boolean!
  }

  type Query {
    notes(limit: Int, offset: Int): NotePage!
    note(id: ID!): Note!
  }

  type Mutation {
    createNote(title: String!, content: String): Note!
    updateNote(id: ID!, title: String, content: String): Note!
    deleteNote(id: ID!): Boolean!
  }
`;
