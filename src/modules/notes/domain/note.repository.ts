import type { Note } from './note.entity.js';

export interface NoteRepository {
  findById(id: string): Promise<Note | null>;
  findAllByOwner(ownerId: string): Promise<Note[]>;
  findAll(): Promise<Note[]>;
  save(note: Note): Promise<void>;
  delete(id: string): Promise<void>;
}
