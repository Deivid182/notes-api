import { type Server } from 'node:http';

import { createGraphQLServer, type GraphQLHandle } from '#app/presentation/graphql/server';
import { ConsoleLogger } from '#modules/shared/infrastructure/adapters/console-logger.adapter';

import { buildContainer, type Container } from './container.js';
import { bootstrapPersistence } from './modules/shared/infrastructure/persistence/bootstrap.js';
import { buildSharedContext } from './modules/shared/infrastructure/shared-context.js';
import { createHttpApp } from './presentation/http/app.js';

import type { Clock } from '#modules/shared/domain/interfaces/clock.interface';
import type { Logger } from '#modules/shared/domain/interfaces/logger.interface';
import type { Env } from './modules/shared/infrastructure/config/env.js';
import type { Express } from 'express';

export interface CreateAppOptions {
  logger?: Logger;
  clock?: Clock;
}

export interface App {
  container: Container;
  /** App de Express, sin escuchar. Útil para supertest. */
  http: Express;
  /** Handle de GraphQL Yoga, sin escuchar. `graphql.yoga.fetch` sirve para tests. */
  graphql: GraphQLHandle;
  /** Empieza a escuchar según `PRESENTATION_PROTOCOL`. */
  start(): Promise<void>;
  /** Cierra servidores y persistencia en orden inverso. Idempotente. */
  stop(): Promise<void>;
}

/**
 * Composition root: construye todo sin efectos de red. Solo `start()` abre puertos.
 * `main.ts` lo usa para producción y los tests e2e para ejercitar el mismo wiring.
 */
export async function createApp(env: Env, options: CreateAppOptions = {}): Promise<App> {
  const logger = options.logger ?? new ConsoleLogger();
  const { persistence, shutdown: shutdownPersistence } = await bootstrapPersistence(env, logger);

  let container: Container;
  let http: Express;
  let graphql: GraphQLHandle;
  try {
    const shared = buildSharedContext({ env, persistence, logger, clock: options.clock });
    container = buildContainer({ shared });
    http = createHttpApp(container);
    graphql = createGraphQLServer(container, env.PORT_GRAPHQL);
  } catch (e) {
    await shutdownPersistence();
    throw e;
  }

  const stops: Array<() => Promise<void>> = [shutdownPersistence];
  let started = false;
  let stopped = false;

  return {
    container,
    http,
    graphql,

    async start() {
      if (started) return;
      started = true;
      logger.info('Starting application', {
        env: env.NODE_ENV,
        protocol: env.PRESENTATION_PROTOCOL,
        engine: env.DATABASE_ENGINE,
      });

      if (env.PRESENTATION_PROTOCOL === 'http' || env.PRESENTATION_PROTOCOL === 'both') {
        const server = await listen(http, env.PORT_HTTP);
        logger.info(`HTTP listening on :${env.PORT_HTTP}`);
        stops.push(() => closeServer(server));
      }

      if (env.PRESENTATION_PROTOCOL === 'graphql' || env.PRESENTATION_PROTOCOL === 'both') {
        await graphql.start();
        logger.info(`GraphQL listening on :${env.PORT_GRAPHQL}${graphql.yoga.graphqlEndpoint}`);
        stops.push(() => graphql.stop());
      }
    },

    async stop() {
      if (stopped) return;
      stopped = true;
      for (const stop of [...stops].reverse()) {
        try {
          await stop();
        } catch (e) {
          logger.error('Error during shutdown step', {
            message: e instanceof Error ? e.message : String(e),
          });
        }
      }
    },
  };
}

function listen(app: Express, port: number): Promise<Server> {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => resolve(server));
    server.once('error', reject);
  });
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}
