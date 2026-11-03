import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runSqlMigrations, type MigrationStore } from '../sql-migrations.js';

import type { Logger } from '#modules/shared/domain/interfaces/logger.interface';
import type { Pool } from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));

function postgresStore(pool: Pool): MigrationStore {
  return {
    async ensureTable() {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS _migrations (
          name       TEXT PRIMARY KEY,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);
    },
    async listApplied() {
      const { rows } = await pool.query<{ name: string }>('SELECT name FROM _migrations');
      return rows.map((r) => r.name);
    },
    async apply(name, sql) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [name]);
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    },
  };
}

export function runPostgresMigrations(pool: Pool, logger: Logger): Promise<void> {
  return runSqlMigrations({
    engine: 'postgres',
    dir: join(__dirname, 'migrations'),
    store: postgresStore(pool),
    logger,
  });
}
