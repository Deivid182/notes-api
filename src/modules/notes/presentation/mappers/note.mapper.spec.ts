import { describe, expect, it } from 'vitest';

import { NoteContent } from '../../domain/note-content.vo.js';
import { NoteTitle } from '../../domain/note-title.vo.js';
import { Note } from '../../domain/note.entity.js';

import { mapNote, mapNotePage } from './note.mapper.js';

const note = Note.create({
  id: 'n1',
  ownerId: 'u1',
  title: NoteTitle.create('Title'),
  content: NoteContent.create('Body'),
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-02T00:00:00Z'),
});

describe('note mappers', () => {
  it('mapNote flattens VOs and serialises dates', () => {
    expect(mapNote(note)).toEqual({
      id: 'n1',
      ownerId: 'u1',
      title: 'Title',
      content: 'Body',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    });
  });

  it('mapNotePage maps every item and keeps the paging fields', () => {
    expect(mapNotePage({ items: [note, note], limit: 2, offset: 4, hasMore: true })).toEqual({
      items: [mapNote(note), mapNote(note)],
      limit: 2,
      offset: 4,
      hasMore: true,
    });
  });
});
