import { responseTypeDef } from '#modules/shared/presentation/graphql/response';

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

  ${responseTypeDef('NoteResponse', 'Note')}
  ${responseTypeDef('NotePageResponse', 'NotePage')}

  type Query {
    notes(limit: Int, offset: Int): NotePageResponse!
    note(id: ID!): NoteResponse!
  }

  type Mutation {
    createNote(title: String!, content: String): NoteResponse!
    updateNote(id: ID!, title: String, content: String): NoteResponse!
    deleteNote(id: ID!): EmptyResponse!
  }
`;
