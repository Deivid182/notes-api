import { describe, expect, it } from 'vitest';

import { connectSqlite } from '#modules/shared/infrastructure/persistence/sqlite/connection';
import { runSqliteMigrations } from '#modules/shared/infrastructure/persistence/sqlite/migrate';

import { SqliteNoteRepositoryImpl } from './sqlite-note.repository.impl.js';

const silent = { debug() {}, info() {}, warn() {}, error() {} };

describe('SqliteNoteRepositoryImpl rehydration', () => {
  it('loads stored rows even if they no longer satisfy current VO rules', async () => {
    const db = connectSqlite(':memory:');
    runSqliteMigrations(db, silent);
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
       VALUES ('u1', 'a@test.com', 'h', 'user', ?, ?)`,
    ).run(now, now);
    // Fila "legacy": título de 200 chars y contenido de 20.000 (hoy inválidos).
    db.prepare(
      `INSERT INTO notes (id, owner_id, title, content, created_at, updated_at)
       VALUES ('n1', 'u1', ?, ?, ?, ?)`,
    ).run('t'.repeat(200), 'c'.repeat(20_000), now, now);

    const repo = new SqliteNoteRepositoryImpl(db);
    const note = await repo.findById('n1');
    expect(note?.title.toString()).toHaveLength(200);
    expect(note?.content.toString()).toHaveLength(20_000);
    db.close();
  });
});
