import { NotFoundError, ValidationError } from '#modules/shared/domain/error';

import { NoteContent } from '../domain/note-content.vo.js';
import { NoteTitle } from '../domain/note-title.vo.js';

import { assertCanWrite } from './authorization.js';

import type { Clock } from '#modules/shared/domain/interfaces/clock.interface';
import type { Actor } from './actor.js';
import type { Note } from '../domain/note.entity.js';
import type { NoteRepository } from '../domain/note.repository.js';

export interface UpdateNoteInput {
  actor: Actor;
  noteId: string;
  title?: string;
  content?: string;
}

export class UpdateNoteUseCase {
  constructor(
    private noteRepository: NoteRepository,
    private clock: Clock,
  ) {}

  async execute(input: UpdateNoteInput): Promise<Note> {
    if (input.title === undefined && input.content === undefined) {
      throw new ValidationError('Nothing to update');
    }

    const note = await this.noteRepository.findById(input.noteId);
    if (!note) throw new NotFoundError('Note not found');
    assertCanWrite(note, input.actor);

    note.update(
      {
        title: input.title !== undefined ? NoteTitle.create(input.title) : undefined,
        content: input.content !== undefined ? NoteContent.create(input.content) : undefined,
      },
      this.clock.now(),
    );
    await this.noteRepository.save(note);
    return note;
  }
}
