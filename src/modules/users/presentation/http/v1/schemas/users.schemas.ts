import z from 'zod';

export const createUserSchema = z.object({
  role: z.string().min(1, 'Role is required'),
  email: z.email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const assignRoleSchema = z.object({
  role: z.string().min(1, 'Role is required'),
});
