import { type Pool } from 'pg';

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
  created_at: Date;
  updated_at: Date;
}

export class PostgresNoteRepositoryImpl implements NoteRepository {
  constructor(private pool: Pool) {}

  async findById(id: string): Promise<Note | null> {
    const { rows } = await this.pool.query<Row>('SELECT * FROM notes WHERE id = $1', [id]);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async findAllByOwner(ownerId: string, page: PageRequest): Promise<Note[]> {
    const { rows } = await this.pool.query<Row>(
      `SELECT * FROM notes WHERE owner_id = $1
       ORDER BY created_at DESC, id DESC LIMIT $2 OFFSET $3`,
      [ownerId, page.limit, page.offset],
    );
    return rows.map((r) => this.toEntity(r));
  }

  async findAll(page: PageRequest): Promise<Note[]> {
    const { rows } = await this.pool.query<Row>(
      'SELECT * FROM notes ORDER BY created_at DESC, id DESC LIMIT $1 OFFSET $2',
      [page.limit, page.offset],
    );
    return rows.map((r) => this.toEntity(r));
  }

  async save(note: Note): Promise<void> {
    await this.pool.query(
      `INSERT INTO notes (id, owner_id, title, content, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         content = EXCLUDED.content,
         updated_at = EXCLUDED.updated_at`,
      [note.id, note.ownerId, note.title.value, note.content.value, note.createdAt, note.updatedAt],
    );
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM notes WHERE id = $1', [id]);
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
