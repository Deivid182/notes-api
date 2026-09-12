import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT_HTTP: z.coerce.number().default(3000),
  PORT_GRAPHQL: z.coerce.number().default(4000),
  PRESENTATION_PROTOCOL: z.enum(['http', 'graphql', 'both']).default('http'),
  DATABASE_ENGINE: z.enum(['sqlite', 'postgres', 'mongodb']).default('sqlite'),
  DATABASE_URL: z.string().default('./data/notes.db'),
  DATABASE_NAME: z.string().default('notes_api'),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  DEFAULT_USER_ROLE: z.string().default('user'),
});

export type Env = z.infer<typeof schema>;

export function loadEnv(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}
