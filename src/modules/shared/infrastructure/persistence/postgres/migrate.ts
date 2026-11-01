import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Logger } from '#modules/shared/domain/interfaces/logger.interface';
import type { Pool } from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function runPostgresMigrations(pool: Pool, logger: Logger): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const dir = join(__dirname, 'migrations');
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const { rows } = await pool.query<{ name: string }>('SELECT name FROM _migrations');
  const applied = new Set(rows.map((r) => r.name));

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = readFileSync(join(dir, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      logger.info(`postgres migration applied: ${file}`);
    } catch (e) {
      await client.query('ROLLBACK');
      logger.error(`postgres migration failed: ${file}`, {
        message: e instanceof Error ? e.message : String(e),
      });
      throw e;
    } finally {
      client.release();
    }
  }
}
