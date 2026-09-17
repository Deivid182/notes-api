// import { type MongoClient, type Db } from 'mongodb';
import 'dotenv/config';
import { type DatabaseSync } from 'node:sqlite';

import { ConsoleLogger } from '#modules/shared/infrastructure/adapters/console-logger.adapter';
import { createGraphQLServer } from '#modules/shared/presentation/graphql/server';

import {
  buildContainer,
  buildSharedContext,
  type Persistence,
} from './modules/shared/infrastructure/config/container.js';
import { loadEnv, type Env } from './modules/shared/infrastructure/config/env.js';
import { connectSqlite } from './modules/shared/infrastructure/persistence/sqlite/connection.js';
import { runSqliteMigrations } from './modules/shared/infrastructure/persistence/sqlite/migrate.js';
import { createHttpServer } from './modules/shared/presentation/http/v1/index.js';

// import { ConsoleLogger } from './modules/shared/infrastructure/adapters/console-logger.adapter.js';

// import type { DatabaseSync } from 'node:sqlite';
// import type { Pool } from 'pg';

// import { connectMongo } from './infrastructure/persistence/mongodb/connection.js';
// import { runMongoMigrations } from './infrastructure/persistence/mongodb/migrate.js';
// import { connectPostgres } from './infrastructure/persistence/postgres/connection.js';
// import { runPostgresMigrations } from './infrastructure/persistence/postgres/migrate.js';

interface BootstrapResult {
  persistence: Persistence;
  shutdown: () => Promise<void>;
}

async function bootstrapPersistence(env: Env, logger: ConsoleLogger): Promise<BootstrapResult> {
  switch (env.DATABASE_ENGINE) {
    case 'sqlite': {
      const db: DatabaseSync = connectSqlite(env.DATABASE_URL);
      if (env.RUN_MIGRATIONS) runSqliteMigrations(db, logger);
      return {
        persistence: { sqlite: db },
        shutdown: async () => {
          db.close();
        },
      };
      // return {
      //   persistence: { sqlite: undefined },
      //   shutdown: async () => {
      //     logger.info('SQLite persistence shutdown (no-op)');
      //   },
      // };
    }

    case 'postgres': {
      // const pool: Pool = connectPostgres(env.DATABASE_URL);
      // if (env.RUN_MIGRATIONS) await runPostgresMigrations(pool, logger);
      // return {
      //   persistence: { postgres: pool },
      //   shutdown: async () => {
      //     await pool.end();
      //   },
      // };

      return {
        persistence: { postgres: undefined },
        shutdown: async () => {
          logger.info('Postgres persistence shutdown (no-op)');
        },
      };
    }

    case 'mongodb': {
      // const { client, db }: { client: MongoClient; db: Db } = await connectMongo(
      //   env.DATABASE_URL,
      //   env.DATABASE_NAME,
      // );
      // if (env.RUN_MIGRATIONS) await runMongoMigrations(db, logger);
      // return {
      //   persistence: { mongodb: db },
      //   shutdown: async () => {
      //     await client.close();
      //   },
      // };
      return {
        persistence: { mongodb: undefined },
        shutdown: async () => {
          logger.info('MongoDB persistence shutdown (no-op)');
        },
      };
    }
  }
}

async function main(): Promise<void> {
  const env = loadEnv();
  const logger = new ConsoleLogger();

  logger.info('Starting application', {
    env: env.NODE_ENV,
    protocol: env.PRESENTATION_PROTOCOL,
    engine: env.DATABASE_ENGINE,
  });

  logger.info('Bootstrapping', {
    env: env.NODE_ENV,
    protocol: env.PRESENTATION_PROTOCOL,
    engine: env.DATABASE_ENGINE,
  });

  // 1) Persistencia (conexiones + migraciones si RUN_MIGRATIONS=true).
  const { persistence, shutdown: shutdownPersistence } = await bootstrapPersistence(env, logger);

  // 2) Composición: shared context → container raíz (que orquesta los módulos).
  const shared = buildSharedContext({ env, persistence, logger });
  const container = buildContainer({ shared });

  void container; // TODO: usar container para pasar a los servers de HTTP y GraphQL.

  // 3) Presentación: según PRESENTATION_PROTOCOL.
  const stops: Array<() => Promise<void>> = [shutdownPersistence];

  if (env.PRESENTATION_PROTOCOL === 'http' || env.PRESENTATION_PROTOCOL === 'both') {
    // logger.info(`HTTP listening on :${env.PORT_HTTP}`);
    const app = createHttpServer(container);
    const server = app.listen(env.PORT_HTTP, () => {
      logger.info(`HTTP listening on :${env.PORT_HTTP}`);
    });
    stops.push(
      () =>
        new Promise<void>((resolve, reject) =>
          server.close((err) => (err ? reject(err) : resolve())),
        ),
    );
  }

  if (env.PRESENTATION_PROTOCOL === 'graphql' || env.PRESENTATION_PROTOCOL === 'both') {
    // logger.info(`GraphQL listening on :${env.PORT_GRAPHQL}`);
    const gql = createGraphQLServer(container, env.PORT_GRAPHQL);
    await gql.start();
    logger.info(`GraphQL listening on :${env.PORT_GRAPHQL}${gql.yoga.graphqlEndpoint}`);
    stops.push(() => gql.stop());
  }

  // 4) Graceful shutdown.
  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`Received ${signal}, shutting down...`);
    for (const stop of [...stops].reverse()) {
      try {
        await stop();
      } catch (e) {
        logger.error('Error during shutdown step', {
          message: e instanceof Error ? e.message : String(e),
        });
      }
    }
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Fatal error during bootstrap:', err);
  process.exit(1);
});
