import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Logger } from '#modules/shared/domain/interfaces/logger.interface';
import type { DatabaseSync } from 'node:sqlite';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function runSqliteMigrations(db: DatabaseSync, logger: Logger): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name       TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const dir = join(__dirname, 'migrations');
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const applied = new Set<string>(
    (db.prepare('SELECT name FROM _migrations').all() as Array<{ name: string }>).map(
      (r) => r.name,
    ),
  );

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = readFileSync(join(dir, file), 'utf8');
    db.exec('BEGIN');
    try {
      db.exec(sql);
      db.prepare('INSERT INTO _migrations (name, applied_at) VALUES (?, ?)').run(
        file,
        new Date().toISOString(),
      );
      db.exec('COMMIT');
      logger.info(`sqlite migration applied: ${file}`);
    } catch (e) {
      db.exec('ROLLBACK');
      logger.error(`sqlite migration failed: ${file}`, {
        message: e instanceof Error ? e.message : String(e),
      });
      throw e;
    }
  }
}

// Ejecutable directo: `tsx src/infrastructure/persistence/sqlite/migrate.ts`
if (import.meta.url === `file://${process.argv[1]}`) {
  const { connectSqlite } = await import('./connection.js');
  const { ConsoleLogger } = await import('../../adapters/console-logger.adapter.js');
  const url = process.env.DATABASE_URL ?? './data/notes.db';
  const db = connectSqlite(url);
  runSqliteMigrations(db, new ConsoleLogger());
  db.close();
}
