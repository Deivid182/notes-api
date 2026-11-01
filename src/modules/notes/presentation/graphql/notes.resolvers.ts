import { requireUser, toGraphQLError } from '#modules/shared/presentation/graphql/helpers';

import { toNoteDTO } from '../http/v1/dtos/notes.dto.js';

import type { GraphQLContext } from '#modules/shared/presentation/graphql/context';

export const notesResolvers = {
  Query: {
    notes: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const actor = requireUser(ctx);
      try {
        const notes = await ctx.container.useCases.listNotes.execute({ actor });
        return notes.map(toNoteDTO);
      } catch (e) {
        throw toGraphQLError(e);
      }
    },
    note: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const actor = requireUser(ctx);
      try {
        const note = await ctx.container.useCases.getNote.execute({ actor, noteId: args.id });
        return toNoteDTO(note);
      } catch (e) {
        throw toGraphQLError(e);
      }
    },
  },
  Mutation: {
    createNote: async (
      _: unknown,
      args: { title: string; content?: string },
      ctx: GraphQLContext,
    ) => {
      const actor = requireUser(ctx);
      try {
        const note = await ctx.container.useCases.createNote.execute({ actor, ...args });
        return toNoteDTO(note);
      } catch (e) {
        throw toGraphQLError(e);
      }
    },
    updateNote: async (
      _: unknown,
      args: { id: string; title?: string; content?: string },
      ctx: GraphQLContext,
    ) => {
      const actor = requireUser(ctx);
      try {
        const note = await ctx.container.useCases.updateNote.execute({
          actor,
          noteId: args.id,
          title: args.title,
          content: args.content,
        });
        return toNoteDTO(note);
      } catch (e) {
        throw toGraphQLError(e);
      }
    },
    deleteNote: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const actor = requireUser(ctx);
      try {
        await ctx.container.useCases.deleteNote.execute({ actor, noteId: args.id });
        return true;
      } catch (e) {
        throw toGraphQLError(e);
      }
    },
  },
};
