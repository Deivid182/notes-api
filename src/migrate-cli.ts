import { parseEnv, type Env } from './modules/shared/infrastructure/config/env.js';
import { bootstrapPersistence } from './modules/shared/infrastructure/persistence/bootstrap.js';

import type { Logger } from '#modules/shared/domain/interfaces/logger.interface';

export const ENGINES: Array<Env['DATABASE_ENGINE']> = ['sqlite', 'postgres', 'mongodb'];

/**
 * Aplica las migraciones pendientes del motor indicado (o de `DATABASE_ENGINE` si no se indica).
 * Se re-valida el entorno con ese motor: así `DATABASE_URL` se exige para él.
 */
export async function runMigrateCli(
  engine: string | undefined,
  rawEnv: NodeJS.ProcessEnv,
  logger: Logger,
): Promise<void> {
  if (engine && !ENGINES.includes(engine as Env['DATABASE_ENGINE'])) {
    throw new Error(`Unknown engine "${engine}". Use one of: ${ENGINES.join(', ')}`);
  }

  const env = parseEnv({
    ...rawEnv,
    ...(engine ? { DATABASE_ENGINE: engine } : {}),
    RUN_MIGRATIONS: 'true',
  });

  logger.info('Running migrations', { engine: env.DATABASE_ENGINE });
  const { shutdown } = await bootstrapPersistence(env, logger);
  await shutdown();
  logger.info('Migrations finished', { engine: env.DATABASE_ENGINE });
}
