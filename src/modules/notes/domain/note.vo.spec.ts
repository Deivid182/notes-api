import { describe, expect, it } from 'vitest';

import { ValidationError } from '#modules/shared/domain/error';

import { NoteContent } from './note-content.vo.js';
import { NoteTitle } from './note-title.vo.js';
import { Note } from './note.entity.js';

describe('NoteTitle', () => {
  it('trims the value', () => {
    expect(NoteTitle.create('  hi  ').value).toBe('hi');
  });

  it.each(['', '   ', 'x'.repeat(151)])('rejects invalid title %#', (raw) => {
    expect(() => NoteTitle.create(raw)).toThrow(ValidationError);
  });
});

describe('restore', () => {
  it('does not apply creation rules to stored values', () => {
    expect(NoteTitle.restore('x'.repeat(200)).value).toHaveLength(200);
    expect(NoteTitle.restore('').value).toBe('');
    expect(NoteContent.restore('x'.repeat(20_000)).value).toHaveLength(20_000);
  });
});

describe('NoteContent', () => {
  it('accepts empty and max-length content', () => {
    expect(NoteContent.create('').value).toBe('');
    expect(() => NoteContent.create('x'.repeat(10_000))).not.toThrow();
  });

  it('rejects content over 10.000 chars', () => {
    expect(() => NoteContent.create('x'.repeat(10_001))).toThrow(ValidationError);
  });
});

describe('Note.update', () => {
  const at = new Date('2026-01-01T00:00:00Z');
  const later = new Date('2026-02-01T00:00:00Z');

  it('patches only provided fields and bumps updatedAt', () => {
    const note = Note.create({
      id: '1',
      ownerId: 'o',
      title: NoteTitle.create('a'),
      content: NoteContent.create('c'),
      createdAt: at,
      updatedAt: at,
    });
    note.update({ title: NoteTitle.create('b') }, later);
    expect(note.title.value).toBe('b');
    expect(note.content.value).toBe('c');
    expect(note.updatedAt).toBe(later);
    expect(note.createdAt).toBe(at);
  });
});

describe('note value objects equality', () => {
  it('compare by value', () => {
    expect(NoteTitle.create(' a ').equals(NoteTitle.create('a'))).toBe(true);
    expect(NoteTitle.create('a').equals(NoteTitle.create('b'))).toBe(false);
    expect(NoteContent.create('x').equals(NoteContent.create('x'))).toBe(true);
    expect(NoteContent.create('x').equals(NoteContent.create('y'))).toBe(false);
  });
});
