import { newUuid } from '#modules/shared/domain/uuid';

import { NoteContent } from '../domain/note-content.vo.js';
import { NoteTitle } from '../domain/note-title.vo.js';
import { Note } from '../domain/note.entity.js';

import type { Actor } from '#modules/shared/domain/actor';
import type { Clock } from '#modules/shared/domain/interfaces/clock.interface';
import type { NoteRepository } from '../domain/note.repository.js';

export interface CreateNoteInput {
  actor: Actor;
  title: string;
  content?: string;
}

export class CreateNoteUseCase {
  constructor(
    private noteRepository: NoteRepository,
    private clock: Clock,
  ) {}

  async execute(input: CreateNoteInput): Promise<Note> {
    const now = this.clock.now();
    const note = Note.create({
      id: newUuid(),
      ownerId: input.actor.id,
      title: NoteTitle.create(input.title),
      content: NoteContent.create(input.content ?? ''),
      createdAt: now,
      updatedAt: now,
    });
    await this.noteRepository.save(note);
    return note;
  }
}
