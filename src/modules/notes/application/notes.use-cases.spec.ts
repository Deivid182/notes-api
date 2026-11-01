import { describe, expect, it } from 'vitest';

import { ForbiddenError, NotFoundError } from '#modules/shared/domain/error';

import { type Note } from '../domain/note.entity.js';

import { CreateNoteUseCase } from './create-note.use-case.js';
import { DeleteNoteUseCase } from './delete-note.use-case.js';
import { GetNoteUseCase } from './get-note.use-case.js';
import { ListNotesUseCase } from './list-notes.use-case.js';
import { UpdateNoteUseCase } from './update-note.use-case.js';

import type { Actor } from './actor.js';
import type { NoteRepository } from '../domain/note.repository.js';

class InMemoryNoteRepository implements NoteRepository {
  items = new Map<string, Note>();
  async findById(id: string) {
    return this.items.get(id) ?? null;
  }
  async findAllByOwner(ownerId: string) {
    return [...this.items.values()].filter((n) => n.ownerId === ownerId);
  }
  async findAll() {
    return [...this.items.values()];
  }
  async save(note: Note) {
    this.items.set(note.id, note);
  }
  async delete(id: string) {
    this.items.delete(id);
  }
}

const clock = { now: () => new Date('2026-01-01T00:00:00Z') };
const alice: Actor = { id: 'alice', role: 'user' };
const bob: Actor = { id: 'bob', role: 'user' };
const admin: Actor = { id: 'root', role: 'admin' };

function setup() {
  const repo = new InMemoryNoteRepository();
  return {
    repo,
    create: new CreateNoteUseCase(repo, clock),
    get: new GetNoteUseCase(repo),
    list: new ListNotesUseCase(repo),
    update: new UpdateNoteUseCase(repo, clock),
    del: new DeleteNoteUseCase(repo),
  };
}

describe('notes use cases', () => {
  it('creates a note owned by the actor', async () => {
    const { create, repo } = setup();
    const note = await create.execute({ actor: alice, title: ' Hi ', content: 'x' });
    expect(note.ownerId).toBe('alice');
    expect(note.title.toString()).toBe('Hi');
    expect(repo.items.size).toBe(1);
  });

  it('lists only own notes, admin lists all', async () => {
    const { create, list } = setup();
    await create.execute({ actor: alice, title: 'a' });
    await create.execute({ actor: bob, title: 'b' });
    expect(await list.execute({ actor: alice })).toHaveLength(1);
    expect(await list.execute({ actor: admin })).toHaveLength(2);
  });

  it('forbids access to others notes, allows admin', async () => {
    const { create, get } = setup();
    const note = await create.execute({ actor: alice, title: 'a' });
    await expect(get.execute({ actor: bob, noteId: note.id })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(get.execute({ actor: admin, noteId: note.id })).resolves.toBe(note);
  });

  it('throws NotFound for missing note', async () => {
    const { get } = setup();
    await expect(get.execute({ actor: alice, noteId: 'nope' })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('updates and deletes with authorization', async () => {
    const { create, update, del, repo } = setup();
    const note = await create.execute({ actor: alice, title: 'a' });

    await expect(
      update.execute({ actor: bob, noteId: note.id, title: 'z' }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    const updated = await update.execute({ actor: alice, noteId: note.id, title: 'new' });
    expect(updated.title.toString()).toBe('new');

    await expect(del.execute({ actor: bob, noteId: note.id })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await del.execute({ actor: alice, noteId: note.id });
    expect(repo.items.size).toBe(0);
  });
});
