import { type DatabaseSync } from 'node:sqlite';

import { NoteContent } from '#modules/notes/domain/note-content.vo';
import { NoteTitle } from '#modules/notes/domain/note-title.vo';
import { Note } from '#modules/notes/domain/note.entity';
import { type NoteRepository } from '#modules/notes/domain/note.repository';
import { type PageRequest } from '#modules/shared/domain/pagination';

interface Row {
  id: string;
  owner_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export class SqliteNoteRepositoryImpl implements NoteRepository {
  constructor(private db: DatabaseSync) {}

  async findById(id: string): Promise<Note | null> {
    const row = this.db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as unknown as
      Row | undefined;
    return row ? this.toEntity(row) : null;
  }

  async findAllByOwner(ownerId: string, page: PageRequest): Promise<Note[]> {
    const rows = this.db
      .prepare(
        'SELECT * FROM notes WHERE owner_id = ? ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?',
      )
      .all(ownerId, page.limit, page.offset) as unknown as Row[];
    return rows.map((r) => this.toEntity(r));
  }

  async findAll(page: PageRequest): Promise<Note[]> {
    const rows = this.db
      .prepare('SELECT * FROM notes ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?')
      .all(page.limit, page.offset) as unknown as Row[];
    return rows.map((r) => this.toEntity(r));
  }

  async save(note: Note): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO notes (id, owner_id, title, content, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           title = excluded.title,
           content = excluded.content,
           updated_at = excluded.updated_at`,
      )
      .run(
        note.id,
        note.ownerId,
        note.title.toString(),
        note.content.toString(),
        note.createdAt.toISOString(),
        note.updatedAt.toISOString(),
      );
  }

  async delete(id: string): Promise<void> {
    this.db.prepare('DELETE FROM notes WHERE id = ?').run(id);
  }

  private toEntity(row: Row): Note {
    return Note.create({
      id: row.id,
      ownerId: row.owner_id,
      title: NoteTitle.restore(row.title),
      content: NoteContent.restore(row.content),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
