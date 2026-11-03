import { describe, expect, it } from 'vitest';

import { ForbiddenError } from '#modules/shared/domain/error';

import { NoteContent } from '../domain/note-content.vo.js';
import { NoteTitle } from '../domain/note-title.vo.js';
import { Note } from '../domain/note.entity.js';

import { assertCanRead, assertCanWrite } from './authorization.js';

const note = Note.create({
  id: 'n1',
  ownerId: 'alice',
  title: NoteTitle.create('t'),
  content: NoteContent.create('c'),
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('notes authorization', () => {
  it.each([assertCanRead, assertCanWrite])(
    'allows the owner and admins, forbids others',
    (assert) => {
      expect(() => assert(note, { id: 'alice', role: 'user' })).not.toThrow();
      expect(() => assert(note, { id: 'root', role: 'admin' })).not.toThrow();
      expect(() => assert(note, { id: 'bob', role: 'user' })).toThrow(ForbiddenError);
    },
  );
});
