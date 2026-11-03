import { randomBytes } from 'node:crypto';

import { MongoClient } from 'mongodb';
import { Pool } from 'pg';

export type TestEngine = 'sqlite' | 'postgres' | 'mongodb';

/** Motor bajo prueba: `TEST_DB_ENGINE` (por defecto sqlite en memoria). */
export const testEngine: TestEngine = (process.env.TEST_DB_ENGINE as TestEngine) || 'sqlite';

const DEFAULT_URLS: Record<TestEngine, string> = {
  sqlite: ':memory:',
  postgres: 'postgres://notes:notes@localhost:55432/notes',
  mongodb: 'mongodb://localhost:57017',
};

export interface TestDatabase {
  engine: TestEngine;
  /** Variables de entorno que apuntan la app a esta base. */
  env: { DATABASE_ENGINE: TestEngine; DATABASE_URL: string; DATABASE_NAME: string };
  /** Elimina la base creada (llamar después de cerrar la app). */
  drop(): Promise<void>;
}

/**
 * Crea una base aislada por suite (postgres: `CREATE DATABASE`; mongodb: nombre único;
 * sqlite: memoria). Así los specs no comparten datos aunque corran en paralelo.
 */
export async function createTestDatabase(): Promise<TestDatabase> {
  const engine = testEngine;
  const baseUrl = process.env.TEST_DB_URL || DEFAULT_URLS[engine];
  const name = `e2e_${randomBytes(6).toString('hex')}`;

  switch (engine) {
    case 'sqlite':
      return {
        engine,
        env: { DATABASE_ENGINE: engine, DATABASE_URL: baseUrl, DATABASE_NAME: name },
        drop: async () => {},
      };

    case 'postgres': {
      const admin = new Pool({ connectionString: baseUrl, max: 1 });
      await admin.query(`CREATE DATABASE "${name}"`);
      const url = new URL(baseUrl);
      url.pathname = `/${name}`;
      return {
        engine,
        env: { DATABASE_ENGINE: engine, DATABASE_URL: url.toString(), DATABASE_NAME: name },
        drop: async () => {
          try {
            await admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
          } finally {
            await admin.end();
          }
        },
      };
    }

    case 'mongodb':
      return {
        engine,
        env: { DATABASE_ENGINE: engine, DATABASE_URL: baseUrl, DATABASE_NAME: name },
        drop: async () => {
          const client = new MongoClient(baseUrl);
          try {
            await client.connect();
            await client.db(name).dropDatabase();
          } finally {
            await client.close();
          }
        },
      };
  }
}
