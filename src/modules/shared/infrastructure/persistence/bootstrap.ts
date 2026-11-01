import { connectMongo } from './mongodb/connection.js';
import { runMongoMigrations } from './mongodb/migrate.js';
import { connectPostgres } from './postgres/connection.js';
import { runPostgresMigrations } from './postgres/migrate.js';
import { connectSqlite } from './sqlite/connection.js';
import { runSqliteMigrations } from './sqlite/migrate.js';

import type { Logger } from '#modules/shared/domain/interfaces/logger.interface';
import type { Env } from '../config/env.js';
import type { Persistence } from '../config/shared-context.js';

export interface PersistenceHandle {
  persistence: Persistence;
  shutdown: () => Promise<void>;
}

/** Abre la conexión del motor configurado y, si `RUN_MIGRATIONS`, aplica sus migraciones. */
export async function bootstrapPersistence(env: Env, logger: Logger): Promise<PersistenceHandle> {
  switch (env.DATABASE_ENGINE) {
    case 'sqlite': {
      const db = connectSqlite(env.DATABASE_URL);
      if (env.RUN_MIGRATIONS) runSqliteMigrations(db, logger);
      return {
        persistence: { sqlite: db },
        shutdown: async () => {
          db.close();
        },
      };
    }

    case 'postgres': {
      const pool = connectPostgres(env.DATABASE_URL);
      if (env.RUN_MIGRATIONS) await runPostgresMigrations(pool, logger);
      return {
        persistence: { postgres: pool },
        shutdown: async () => {
          await pool.end();
        },
      };
    }

    case 'mongodb': {
      const { client, db } = await connectMongo(env.DATABASE_URL, env.DATABASE_NAME);
      if (env.RUN_MIGRATIONS) await runMongoMigrations(db, logger);
      return {
        persistence: { mongodb: db },
        shutdown: async () => {
          await client.close();
        },
      };
    }
  }
}
