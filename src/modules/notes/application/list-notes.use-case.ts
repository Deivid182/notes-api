import type { Actor } from './actor.js';
import type { Note } from '../domain/note.entity.js';
import type { NoteRepository } from '../domain/note.repository.js';

export interface ListNotesInput {
  actor: Actor;
}

/** Admins ven todas las notas; el resto, solo las propias. */
export class ListNotesUseCase {
  constructor(private noteRepository: NoteRepository) {}

  async execute(input: ListNotesInput): Promise<Note[]> {
    const { actor } = input;
    return actor.role === 'admin'
      ? this.noteRepository.findAll()
      : this.noteRepository.findAllByOwner(actor.id);
  }
}
