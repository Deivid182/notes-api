import { type Pool } from 'pg';

import { NoteContent } from '#modules/notes/domain/note-content.vo';
import { NoteTitle } from '#modules/notes/domain/note-title.vo';
import { Note } from '#modules/notes/domain/note.entity';
import { type NoteRepository } from '#modules/notes/domain/note.repository';

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

  async findAllByOwner(ownerId: string): Promise<Note[]> {
    const { rows } = await this.pool.query<Row>(
      'SELECT * FROM notes WHERE owner_id = $1 ORDER BY created_at DESC',
      [ownerId],
    );
    return rows.map((r) => this.toEntity(r));
  }

  async findAll(): Promise<Note[]> {
    const { rows } = await this.pool.query<Row>('SELECT * FROM notes ORDER BY created_at DESC');
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
      [
        note.id,
        note.ownerId,
        note.title.toString(),
        note.content.toString(),
        note.createdAt,
        note.updatedAt,
      ],
    );
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM notes WHERE id = $1', [id]);
  }

  private toEntity(row: Row): Note {
    return Note.create({
      id: row.id,
      ownerId: row.owner_id,
      title: NoteTitle.create(row.title),
      content: NoteContent.create(row.content),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
