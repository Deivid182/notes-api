import { ForbiddenError } from '#modules/shared/domain/error';

import { type Note } from '../domain/note.entity.js';

import { type Actor } from './actor.js';

export function assertCanRead(note: Note, actor: Actor): void {
  if (note.ownerId === actor.id) return;
  if (actor.role === 'admin') return;
  throw new ForbiddenError('Not allowed to access this note');
}

export function assertCanWrite(note: Note, actor: Actor): void {
  assertCanRead(note, actor);
}
