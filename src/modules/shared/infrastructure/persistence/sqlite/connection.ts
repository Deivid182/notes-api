import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

/** `:memory:` y `''` (base temporal) no tienen carpeta que crear. */
const isEphemeral = (url: string) => url === ':memory:' || url === '';

export function connectSqlite(url: string): DatabaseSync {
  if (!isEphemeral(url)) {
    mkdirSync(dirname(url), { recursive: true });
  }
  const db = new DatabaseSync(url);
  // WAL no aplica a bases en memoria.
  if (!isEphemeral(url)) db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  return db;
}
