import { z } from 'zod';

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10).optional(),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(10).optional(),
  all: z.boolean().optional(),
});
