import { z } from 'zod';

// La política de contraseña vive en el VO `Password` (dominio). Login no la aplica:
// solo compara contra el hash, para no bloquear cuentas creadas con reglas anteriores.
export const registerSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10).optional(),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(10).optional(),
  all: z.boolean().optional(),
});

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
export type RefreshBody = z.infer<typeof refreshSchema>;
export type LogoutBody = z.infer<typeof logoutSchema>;
