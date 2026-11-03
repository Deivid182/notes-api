import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { RefreshToken } from '#modules/auth/domain/refresh-token.entity';
import { NoteContent } from '#modules/notes/domain/note-content.vo';
import { NoteTitle } from '#modules/notes/domain/note-title.vo';
import { Note } from '#modules/notes/domain/note.entity';
import { newUuid } from '#modules/shared/domain/uuid';
import { Email } from '#modules/shared/domain/value-objects/email.vo';
import { Role } from '#modules/users/domain/role.vo';
import { User } from '#modules/users/domain/user.entity';

import { openContainer } from '../support/test-container.js';
import { createTestDatabase, testEngine, type TestDatabase } from '../support/test-database.js';

const stamp = (i: number) => new Date(Date.UTC(2026, 0, 1, 0, 0, i));
const expiresAt = new Date('2030-01-01T00:00:00.000Z');

describe(`repositories (${testEngine})`, () => {
  let db: TestDatabase;
  let opened: Awaited<ReturnType<typeof openContainer>>;
  let alice: string;
  let bob: string;

  const modules = () => opened.container.modules;

  beforeAll(async () => {
    db = await createTestDatabase();
    opened = await openContainer(db);
    const make = async (email: string) => {
      const id = newUuid();
      await modules().users.userRepository.save(
        User.create({
          id,
          email: Email.create(email),
          passwordHash: 'h',
          role: Role.user(),
          createdAt: stamp(0),
          updatedAt: stamp(0),
        }),
      );
      return id;
    };
    alice = await make('alice@test.com');
    bob = await make('bob@test.com');
  });

  afterAll(async () => {
    await opened.close();
    await db.drop();
  });

  const note = (ownerId: string, title: string, i: number, content = 'c') =>
    Note.create({
      id: newUuid(),
      ownerId,
      title: NoteTitle.create(title),
      content: NoteContent.create(content),
      createdAt: stamp(i),
      updatedAt: stamp(i),
    });

  describe('notes', () => {
    it('saves, reads, updates and deletes a note', async () => {
      const repo = modules().notes.noteRepository;
      const n = note(alice, 'First', 1, 'body');
      await repo.save(n);

      const stored = await repo.findById(n.id);
      expect(stored).toMatchObject({ id: n.id, ownerId: alice });
      expect(stored?.title.value).toBe('First');
      expect(stored?.content.value).toBe('body');
      expect(stored?.createdAt).toEqual(stamp(1));

      n.update({ title: NoteTitle.create('Renamed') }, stamp(9));
      await repo.save(n);
      const updated = await repo.findById(n.id);
      expect(updated?.title.value).toBe('Renamed');
      expect(updated?.content.value).toBe('body');
      expect(updated?.updatedAt).toEqual(stamp(9));
      expect(updated?.createdAt).toEqual(stamp(1));

      await repo.delete(n.id);
      expect(await repo.findById(n.id)).toBeNull();
      await expect(repo.delete(n.id)).resolves.toBeUndefined();
    });

    it('stores empty and large content untouched', async () => {
      const repo = modules().notes.noteRepository;
      const empty = note(alice, 'empty', 2, '');
      const big = note(alice, 'big', 3, 'x'.repeat(10_000));
      await repo.save(empty);
      await repo.save(big);
      expect((await repo.findById(empty.id))?.content.value).toBe('');
      expect((await repo.findById(big.id))?.content.value).toHaveLength(10_000);
    });

    it('lists newest first with a stable order and honours limit/offset', async () => {
      const repo = modules().notes.noteRepository;
      const owner = await (async () => {
        const id = newUuid();
        await modules().users.userRepository.save(
          User.create({
            id,
            email: Email.create(`pager-${id}@test.com`),
            passwordHash: 'h',
            role: Role.user(),
            createdAt: stamp(0),
            updatedAt: stamp(0),
          }),
        );
        return id;
      })();
      const created = [10, 11, 12, 13, 14].map((i) => note(owner, `n${i}`, i));
      for (const n of created) await repo.save(n);

      const all = await repo.findAllByOwner(owner, { limit: 10, offset: 0 });
      expect(all.map((n) => n.title.value)).toEqual(['n14', 'n13', 'n12', 'n11', 'n10']);

      const page = await repo.findAllByOwner(owner, { limit: 2, offset: 1 });
      expect(page.map((n) => n.title.value)).toEqual(['n13', 'n12']);
      expect(await repo.findAllByOwner(owner, { limit: 2, offset: 5 })).toEqual([]);
    });

    it('scopes findAllByOwner to the owner while findAll sees everyone', async () => {
      const repo = modules().notes.noteRepository;
      const a = note(alice, 'scoped-a', 20);
      const b = note(bob, 'scoped-b', 21);
      await repo.save(a);
      await repo.save(b);

      const bobs = await repo.findAllByOwner(bob, { limit: 100, offset: 0 });
      expect(bobs.every((n) => n.ownerId === bob)).toBe(true);
      expect(bobs.some((n) => n.id === b.id)).toBe(true);

      const everyone = await repo.findAll({ limit: 100, offset: 0 });
      const ids = everyone.map((n) => n.id);
      expect(ids).toEqual(expect.arrayContaining([a.id, b.id]));
    });

    it('breaks ties on identical created_at by id, deterministically', async () => {
      const repo = modules().notes.noteRepository;
      const owner = alice;
      const same = [note(owner, 'tie-1', 30), note(owner, 'tie-2', 30), note(owner, 'tie-3', 30)];
      for (const n of same) await repo.save(n);
      const read = async () =>
        (await repo.findAllByOwner(owner, { limit: 100, offset: 0 }))
          .filter((n) => n.title.value.startsWith('tie-'))
          .map((n) => n.id);
      expect(await read()).toEqual(await read());
      expect(await read()).toEqual([...same.map((n) => n.id)].sort().reverse());
    });
  });

  describe('refresh tokens', () => {
    const make = (userId: string, id = newUuid()) =>
      RefreshToken.create({ id, userId, tokenHash: `hash-${id}`, expiresAt, revokedAt: null });

    it('round-trips a token and returns null when unknown', async () => {
      const repo = modules().auth.refreshTokenRepository;
      const t = make(alice);
      await repo.save(t);
      const stored = await repo.findById(t.id);
      expect(stored).toMatchObject({ id: t.id, userId: alice, tokenHash: t.tokenHash });
      expect(stored?.expiresAt).toEqual(expiresAt);
      expect(stored?.revokedAt).toBeNull();
      expect(await repo.findById(newUuid())).toBeNull();
    });

    it('persists a revocation made through save', async () => {
      const repo = modules().auth.refreshTokenRepository;
      const t = make(alice);
      await repo.save(t);
      t.revoke(stamp(5));
      await repo.save(t);
      expect((await repo.findById(t.id))?.revokedAt).toEqual(stamp(5));
    });

    it('revokeAllForUser touches only that user and keeps earlier revocations', async () => {
      const repo = modules().auth.refreshTokenRepository;
      const old = make(bob);
      old.revoke(stamp(1));
      const open = make(bob);
      const other = make(alice);
      for (const t of [old, open, other]) await repo.save(t);

      await repo.revokeAllForUser(bob, stamp(7));

      expect((await repo.findById(old.id))?.revokedAt).toEqual(stamp(1));
      expect((await repo.findById(open.id))?.revokedAt).toEqual(stamp(7));
      expect((await repo.findById(other.id))?.revokedAt).toBeNull();
    });
  });
});
