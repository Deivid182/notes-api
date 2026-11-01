import { NotFoundError } from '#modules/shared/domain/error';

import { assertCanWrite } from './authorization.js';

import type { Actor } from '#modules/shared/domain/actor';
import type { NoteRepository } from '../domain/note.repository.js';

export interface DeleteNoteInput {
  actor: Actor;
  noteId: string;
}

export class DeleteNoteUseCase {
  constructor(private noteRepository: NoteRepository) {}

  async execute(input: DeleteNoteInput): Promise<void> {
    const note = await this.noteRepository.findById(input.noteId);
    if (!note) throw new NotFoundError('Note not found');
    assertCanWrite(note, input.actor);
    await this.noteRepository.delete(note.id);
  }
}
