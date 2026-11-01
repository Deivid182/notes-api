import { normalizePage, toPage, type Page } from '#modules/shared/domain/pagination';

import type { Actor } from '#modules/shared/domain/actor';
import type { Note } from '../domain/note.entity.js';
import type { NoteRepository } from '../domain/note.repository.js';

export interface ListNotesInput {
  actor: Actor;
  limit?: number;
  offset?: number;
}

/** Admins ven todas las notas; el resto, solo las propias. Paginado. */
export class ListNotesUseCase {
  constructor(private noteRepository: NoteRepository) {}

  async execute(input: ListNotesInput): Promise<Page<Note>> {
    const { actor } = input;
    const request = normalizePage(input);
    // Una fila de más: solo sirve para saber si hay otra página.
    const window = { limit: request.limit + 1, offset: request.offset };
    const rows =
      actor.role === 'admin'
        ? await this.noteRepository.findAll(window)
        : await this.noteRepository.findAllByOwner(actor.id, window);
    return toPage(rows, request);
  }
}
