import z from 'zod';

export const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional(),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').optional(),
  content: z.string().optional(),
});
