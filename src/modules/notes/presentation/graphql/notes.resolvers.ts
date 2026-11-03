import { requireUser } from '#modules/shared/presentation/graphql/helpers';

import { mapNote, mapNotePage } from '../mappers/note.mapper.js';

import type { GraphQLContext } from '#modules/shared/presentation/graphql/context';

// Los DomainError se traducen una sola vez en `maskError` (ver graphql/helpers.ts).
export const notesResolvers = {
  Query: {
    notes: async (_: unknown, args: { limit?: number; offset?: number }, ctx: GraphQLContext) => {
      const actor = requireUser(ctx);
      const page = await ctx.container.modules.notes.useCases.listNotes.execute({ actor, ...args });
      return mapNotePage(page);
    },
    note: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const actor = requireUser(ctx);
      const note = await ctx.container.modules.notes.useCases.getNote.execute({
        actor,
        noteId: args.id,
      });
      return mapNote(note);
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
      return mapNote(note);
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
      return mapNote(note);
    },
    deleteNote: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const actor = requireUser(ctx);
      await ctx.container.modules.notes.useCases.deleteNote.execute({
        actor,
        noteId: args.id,
      });
      return true;
    },
  },
};
