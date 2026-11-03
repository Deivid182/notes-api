import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import type { Logger } from '#modules/shared/domain/interfaces/logger.interface';

/** Lo único que cambia entre motores SQL: cómo se guarda el registro y se ejecuta una migración. */
export interface MigrationStore {
  /** Crea la tabla `_migrations` si no existe. */
  ensureTable(): Promise<void>;
  listApplied(): Promise<string[]>;
  /** Ejecuta `sql` y registra `name` en una única transacción. */
  apply(name: string, sql: string): Promise<void>;
}

export interface RunSqlMigrationsOptions {
  engine: string;
  /** Carpeta con los `*.sql`, aplicados en orden alfabético. */
  dir: string;
  store: MigrationStore;
  logger: Logger;
}

export async function runSqlMigrations({
  engine,
  dir,
  store,
  logger,
}: RunSqlMigrationsOptions): Promise<void> {
  await store.ensureTable();

  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  const applied = new Set(await store.listApplied());

  for (const file of files) {
    if (applied.has(file)) continue;
    try {
      await store.apply(file, readFileSync(join(dir, file), 'utf8'));
      logger.info(`${engine} migration applied: ${file}`);
    } catch (e) {
      logger.error(`${engine} migration failed: ${file}`, {
        message: e instanceof Error ? e.message : String(e),
      });
      throw e;
    }
  }
}
