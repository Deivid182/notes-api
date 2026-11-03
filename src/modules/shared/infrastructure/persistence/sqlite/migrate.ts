import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runSqlMigrations, type MigrationStore } from '../sql-migrations.js';

import type { Logger } from '#modules/shared/domain/interfaces/logger.interface';
import type { DatabaseSync } from 'node:sqlite';

const __dirname = dirname(fileURLToPath(import.meta.url));

function sqliteStore(db: DatabaseSync): MigrationStore {
  return {
    async ensureTable() {
      db.exec(`
        CREATE TABLE IF NOT EXISTS _migrations (
          name       TEXT PRIMARY KEY,
          applied_at TEXT NOT NULL
        );
      `);
    },
    async listApplied() {
      return (db.prepare('SELECT name FROM _migrations').all() as Array<{ name: string }>).map(
        (r) => r.name,
      );
    },
    async apply(name, sql) {
      db.exec('BEGIN');
      try {
        db.exec(sql);
        db.prepare('INSERT INTO _migrations (name, applied_at) VALUES (?, ?)').run(
          name,
          new Date().toISOString(),
        );
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
  };
}

export function runSqliteMigrations(
  db: DatabaseSync,
  logger: Logger,
  dir = join(__dirname, 'migrations'),
): Promise<void> {
  return runSqlMigrations({
    engine: 'sqlite',
    dir,
    store: sqliteStore(db),
    logger,
  });
}
