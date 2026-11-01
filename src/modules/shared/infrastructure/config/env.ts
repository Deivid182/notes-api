import { z } from 'zod';

// `z.coerce.boolean()` convertiría la cadena "false" en true.
const booleanFlag = z
  .enum(['true', 'false', '1', '0'])
  .default('false')
  .transform((v) => v === 'true' || v === '1');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT_HTTP: z.coerce.number().default(3000),
  PORT_GRAPHQL: z.coerce.number().default(4000),
  PRESENTATION_PROTOCOL: z.enum(['http', 'graphql', 'both']).default('http'),
  DATABASE_ENGINE: z.enum(['sqlite', 'postgres', 'mongodb']).default('sqlite'),
  DATABASE_URL: z.string().default('./data/notes.db'),
  DATABASE_NAME: z.string().default('notes_api'),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRES_IN: z.string().default('900'),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_REFRESH_EXPIRES_IN: z.string().default('604800'),
  DEFAULT_USER_ROLE: z.string().default('user'),

  RUN_MIGRATIONS: booleanFlag,
});

export type Env = z.infer<typeof schema>;

export function parseEnv(raw: NodeJS.ProcessEnv): Env {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return parsed.data;
}

export function loadEnv(): Env {
  return parseEnv(process.env);
}
