import { z } from 'zod';

// `z.coerce.boolean()` convertiría la cadena "false" en true.
const booleanFlag = z
  .enum(['true', 'false', '1', '0'])
  .default('false')
  .transform((v) => v === 'true' || v === '1');

// 0 = puerto efímero (tests).
const port = z.coerce.number().int().min(0).max(65535);
const positiveInt = z.coerce.number().int().positive();
// Segundos como número ("900") o duración con unidad ("15m", "7d").
const duration = z
  .string()
  .regex(/^\d+\s*(ms|s|m|h|d|w|y)?$/i, 'must be seconds ("900") or a duration ("15m", "7d")');

const DEFAULT_SQLITE_PATH = './data/notes.db';

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT_HTTP: port.default(3000),
    PORT_GRAPHQL: port.default(4000),
    PRESENTATION_PROTOCOL: z.enum(['http', 'graphql', 'both']).default('http'),
    DATABASE_ENGINE: z.enum(['sqlite', 'postgres', 'mongodb']).default('sqlite'),
    // Obligatoria salvo en sqlite, donde cae a un archivo local.
    DATABASE_URL: z.string().min(1).optional(),
    DATABASE_NAME: z.string().default('notes_api'),
    DATABASE_POOL_MAX: positiveInt.default(10),
    DATABASE_CONNECT_TIMEOUT_MS: positiveInt.default(5000),
    JWT_ACCESS_SECRET: z.string().min(1),
    JWT_ACCESS_EXPIRES_IN: duration.default('900'),
    JWT_REFRESH_SECRET: z.string().min(1),
    JWT_REFRESH_EXPIRES_IN: duration.default('604800'),
    DEFAULT_USER_ROLE: z.string().default('user'),

    RUN_MIGRATIONS: booleanFlag,
  })
  .superRefine((env, ctx) => {
    if (env.DATABASE_ENGINE !== 'sqlite' && !env.DATABASE_URL) {
      ctx.addIssue({
        code: 'custom',
        path: ['DATABASE_URL'],
        message: `is required when DATABASE_ENGINE is ${env.DATABASE_ENGINE}`,
      });
    }
  })
  .transform((env) => ({ ...env, DATABASE_URL: env.DATABASE_URL ?? DEFAULT_SQLITE_PATH }));

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
