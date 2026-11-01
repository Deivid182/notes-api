import { NotFoundError } from '#modules/shared/domain/error';

import { assertCanRead } from './authorization.js';

import type { Actor } from './actor.js';
import type { Note } from '../domain/note.entity.js';
import type { NoteRepository } from '../domain/note.repository.js';

export interface GetNoteInput {
  actor: Actor;
  noteId: string;
}

export class GetNoteUseCase {
  constructor(private noteRepository: NoteRepository) {}

  async execute(input: GetNoteInput): Promise<Note> {
    const note = await this.noteRepository.findById(input.noteId);
    if (!note) throw new NotFoundError('Note not found');
    assertCanRead(note, input.actor);
    return note;
  }
}
