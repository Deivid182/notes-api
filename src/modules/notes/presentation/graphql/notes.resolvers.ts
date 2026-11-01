import { requireUser } from '#modules/shared/presentation/graphql/helpers';

import { toNoteDTO } from '../dto/notes.dto.js';

import type { GraphQLContext } from '#modules/shared/presentation/graphql/context';

// Los DomainError se traducen una sola vez en `maskError` (ver graphql/helpers.ts).
export const notesResolvers = {
  Query: {
    notes: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const actor = requireUser(ctx);
      const notes = await ctx.container.modules.notes.useCases.listNotes.execute({ actor });
      return notes.map(toNoteDTO);
    },
    note: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const actor = requireUser(ctx);
      const note = await ctx.container.modules.notes.useCases.getNote.execute({
        actor,
        noteId: args.id,
      });
      return toNoteDTO(note);
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
      return toNoteDTO(note);
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
      return toNoteDTO(note);
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
