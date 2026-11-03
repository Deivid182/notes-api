import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp, gql } from './helpers.js';

const t = await buildTestApp();
afterAll(() => t.close());

describe('notes GraphQL e2e', () => {
  let alice = '';
  let bob = '';

  beforeAll(async () => {
    const reg = async (email: string) => {
      const r = await gql(
        t.yoga,
        `mutation { register(email: "${email}", password: "secret123") { data { accessToken } } }`,
      );
      return (r.data.register as { data: { accessToken: string } }).data.accessToken;
    };
    alice = await reg('alice@test.com');
    bob = await reg('bob@test.com');
  });

  it('requires authentication', async () => {
    const r = await gql(t.yoga, '{ notes { data { hasMore } } }');
    expect(r.errors?.[0]?.extensions.code).toBe('UNAUTHORIZED');
  });

  it('me returns the current user', async () => {
    const r = await gql(t.yoga, '{ me { data { email role } } }', alice);
    expect(r.data.me?.data).toEqual({ email: 'alice@test.com', role: 'user' });
    const anon = await gql(t.yoga, '{ me { data { email } } }');
    expect(anon.errors?.[0]?.extensions.code).toBe('UNAUTHORIZED');
  });

  it('runs create/read/update/delete and enforces ownership', async () => {
    const c = await gql(
      t.yoga,
      'mutation { createNote(title: "g", content: "c") { data { id } } }',
      alice,
    );
    const id = (c.data.createNote as { data: { id: string } }).data.id;

    const u = await gql(
      t.yoga,
      `mutation { updateNote(id: "${id}", title: "g2") { data { title content } } }`,
      alice,
    );
    expect(u.data.updateNote?.data).toEqual({ title: 'g2', content: 'c' });

    const forbidden = await gql(t.yoga, `{ note(id: "${id}") { data { id } } }`, bob);
    expect(forbidden.errors?.[0]?.extensions.code).toBe('FORBIDDEN');

    const d = await gql(
      t.yoga,
      `mutation { deleteNote(id: "${id}") { success statusCode message data } }`,
      alice,
    );
    expect(d.data.deleteNote).toMatchObject({
      success: true,
      statusCode: 200,
      message: 'Note deleted',
      data: null,
    });

    const missing = await gql(t.yoga, `{ note(id: "${id}") { data { id } } }`, alice);
    expect(missing.errors?.[0]?.extensions.code).toBe('NOT_FOUND');
  });

  it('protects the users operations', async () => {
    const me = await gql(t.yoga, '{ me { data { id } } }', alice);
    const aliceId = (me.data.me as { data: { id: string } }).data.id;

    const anonGet = await gql(t.yoga, `{ getUser(id: "${aliceId}") { data { id } } }`);
    expect(anonGet.errors?.[0]?.extensions.code).toBe('UNAUTHORIZED');

    const otherGet = await gql(t.yoga, `{ getUser(id: "${aliceId}") { data { id } } }`, bob);
    expect(otherGet.errors?.[0]?.extensions.code).toBe('FORBIDDEN');

    const selfGet = await gql(t.yoga, `{ getUser(id: "${aliceId}") { data { id } } }`, alice);
    expect(selfGet.data.getUser?.data).toEqual({ id: aliceId });

    const create =
      'mutation { createUser(email: "n@test.com", password: "secret123", role: "admin") { data { role } } }';
    expect((await gql(t.yoga, create)).errors?.[0]?.extensions.code).toBe('UNAUTHORIZED');
    expect((await gql(t.yoga, create, alice)).errors?.[0]?.extensions.code).toBe('FORBIDDEN');
  });

  it('applies the password policy to GraphQL register too', async () => {
    const r = await gql(
      t.yoga,
      'mutation { register(email: "pw@test.com", password: "short") { data { accessToken } } }',
    );
    expect(r.errors?.[0]?.extensions.code).toBe('VALIDATION_ERROR');
    expect(r.errors?.[0]?.extensions).toMatchObject({ success: false, statusCode: 400 });
    expect(r.errors?.[0]?.extensions.timestamp).toBeTruthy();
  });

  it('paginates notes', async () => {
    const reg = await gql(
      t.yoga,
      'mutation { register(email: "gpager@test.com", password: "secret123") { data { accessToken } } }',
    );
    const token = (reg.data.register as { data: { accessToken: string } }).data.accessToken;
    for (let i = 0; i < 3; i++) {
      await gql(t.yoga, `mutation { createNote(title: "g${i}") { data { id } } }`, token);
    }
    const page = await gql(
      t.yoga,
      '{ notes(limit: 2) { data { items { title } limit offset hasMore } } }',
      token,
    );
    const notes = page.data.notes?.data as { items: unknown[]; hasMore: boolean; limit: number };
    expect(notes.items).toHaveLength(2);
    expect(notes).toMatchObject({ limit: 2, hasMore: true });

    const bad = await gql(t.yoga, '{ notes(limit: 500) { data { hasMore } } }', token);
    expect(bad.errors?.[0]?.extensions.code).toBe('VALIDATION_ERROR');
  });
});
