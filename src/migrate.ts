import 'dotenv/config';

import { ConsoleLogger } from '#modules/shared/infrastructure/adapters/console-logger.adapter';

import { loadEnv, type Env } from './modules/shared/infrastructure/config/env.js';
import { bootstrapPersistence } from './modules/shared/infrastructure/persistence/bootstrap.js';

const ENGINES: Array<Env['DATABASE_ENGINE']> = ['sqlite', 'postgres', 'mongodb'];

/**
 * CLI de migraciones: `migrate [sqlite|postgres|mongodb]`.
 * Sin argumento usa `DATABASE_ENGINE`. Aplica las migraciones pendientes y termina.
 */
async function main(): Promise<void> {
  const arg = process.argv[2];
  if (arg && !ENGINES.includes(arg as Env['DATABASE_ENGINE'])) {
    throw new Error(`Unknown engine "${arg}". Use one of: ${ENGINES.join(', ')}`);
  }

  const base = loadEnv();
  const env: Env = {
    ...base,
    DATABASE_ENGINE: (arg as Env['DATABASE_ENGINE'] | undefined) ?? base.DATABASE_ENGINE,
    RUN_MIGRATIONS: true,
  };

  const logger = new ConsoleLogger();
  logger.info('Running migrations', { engine: env.DATABASE_ENGINE });
  const { shutdown } = await bootstrapPersistence(env, logger);
  await shutdown();
  logger.info('Migrations finished', { engine: env.DATABASE_ENGINE });
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
