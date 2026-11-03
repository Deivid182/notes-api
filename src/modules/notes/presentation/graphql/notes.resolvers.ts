import { requireUser } from '#modules/shared/presentation/graphql/helpers';
import { gqlResponse } from '#modules/shared/presentation/graphql/response';

import { mapNote, mapNotePage } from '../mappers/note.mapper.js';

import type { GraphQLContext } from '#app/presentation/graphql/context';

// Los DomainError se traducen una sola vez en `maskError` (ver graphql/helpers.ts).
export const notesResolvers = {
  Query: {
    notes: async (_: unknown, args: { limit?: number; offset?: number }, ctx: GraphQLContext) => {
      const actor = requireUser(ctx);
      const page = await ctx.container.modules.notes.useCases.listNotes.execute({ actor, ...args });
      return gqlResponse({ data: mapNotePage(page), message: 'Notes retrieved' });
    },
    note: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const actor = requireUser(ctx);
      const note = await ctx.container.modules.notes.useCases.getNote.execute({
        actor,
        noteId: args.id,
      });
      return gqlResponse({ data: mapNote(note), message: 'Note retrieved' });
    },
  },
  Mutation: {
    createNote: async (
      _: unknown,
      args: { title: string; content?: string },
      ctx: GraphQLContext,
    ) => {
      const actor = requireUser(ctx);
      const note = await ctx.container.modules.notes.useCases.createNote.execute({
        actor,
        ...args,
      });
      return gqlResponse({ data: mapNote(note), message: 'Note created', statusCode: 201 });
    },
    updateNote: async (
      _: unknown,
      args: { id: string; title?: string; content?: string },
      ctx: GraphQLContext,
    ) => {
      const actor = requireUser(ctx);
      const note = await ctx.container.modules.notes.useCases.updateNote.execute({
        actor,
        noteId: args.id,
        title: args.title,
        content: args.content,
      });
      return gqlResponse({ data: mapNote(note), message: 'Note updated' });
    },
    deleteNote: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const actor = requireUser(ctx);
      await ctx.container.modules.notes.useCases.deleteNote.execute({
        actor,
        noteId: args.id,
      });
      return gqlResponse({ data: null, message: 'Note deleted' });
    },
  },
};
