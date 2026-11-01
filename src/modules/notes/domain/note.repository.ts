import type { PageRequest } from '#modules/shared/domain/pagination';
import type { Note } from './note.entity.js';

export interface NoteRepository {
  findById(id: string): Promise<Note | null>;
  /** Más recientes primero; orden estable (`created_at`, `id`). */
  findAllByOwner(ownerId: string, page: PageRequest): Promise<Note[]>;
  findAll(page: PageRequest): Promise<Note[]>;
  save(note: Note): Promise<void>;
  delete(id: string): Promise<void>;
}
