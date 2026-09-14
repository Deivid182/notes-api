import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export function connectSqlite(url: string): DatabaseSync {
  if (url !== ':memory:') {
    mkdirSync(dirname(url), { recursive: true });
  }
  const db = new DatabaseSync(url);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  return db;
}
