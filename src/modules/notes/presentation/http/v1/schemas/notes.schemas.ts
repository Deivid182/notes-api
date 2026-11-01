import z from 'zod';

export const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional(),
});

// Solo la forma: los rangos de limit/offset los valida `normalizePage` (dominio).
export const listNotesQuerySchema = z.object({
  limit: z.coerce.number().optional(),
  offset: z.coerce.number().optional(),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').optional(),
  content: z.string().optional(),
});

export type CreateNoteBody = z.infer<typeof createNoteSchema>;
export type UpdateNoteBody = z.infer<typeof updateNoteSchema>;
export type ListNotesQuery = z.infer<typeof listNotesQuerySchema>;
