import z from 'zod';

export const createUserSchema = z.object({
  role: z.string().min(1, 'Role cannot be empty').optional(),
  email: z.email('Invalid email address'),
  password: z.string(),
});

export const assignRoleSchema = z.object({
  role: z.string().min(1, 'Role is required'),
});

export type CreateUserBody = z.infer<typeof createUserSchema>;
export type AssignRoleBody = z.infer<typeof assignRoleSchema>;
