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
        `mutation { register(email: "${email}", password: "secret123") { accessToken } }`,
      );
      return (r.data.register as { accessToken: string }).accessToken;
    };
    alice = await reg('alice@test.com');
    bob = await reg('bob@test.com');
  });

  it('requires authentication', async () => {
    const r = await gql(t.yoga, '{ notes { id } }');
    expect(r.errors?.[0]?.extensions.code).toBe('UNAUTHENTICATED');
  });

  it('me returns the current user', async () => {
    const r = await gql(t.yoga, '{ me { email role } }', alice);
    expect(r.data.me).toEqual({ email: 'alice@test.com', role: 'user' });
    const anon = await gql(t.yoga, '{ me { email } }');
    expect(anon.errors?.[0]?.extensions.code).toBe('UNAUTHENTICATED');
  });

  it('runs create/read/update/delete and enforces ownership', async () => {
    const c = await gql(t.yoga, 'mutation { createNote(title: "g", content: "c") { id } }', alice);
    const id = (c.data.createNote as { id: string }).id;

    const u = await gql(
      t.yoga,
      `mutation { updateNote(id: "${id}", title: "g2") { title content } }`,
      alice,
    );
    expect(u.data.updateNote).toEqual({ title: 'g2', content: 'c' });

    const forbidden = await gql(t.yoga, `{ note(id: "${id}") { id } }`, bob);
    expect(forbidden.errors?.[0]?.extensions.code).toBe('FORBIDDEN');

    const d = await gql(t.yoga, `mutation { deleteNote(id: "${id}") }`, alice);
    expect(d.data.deleteNote).toBe(true);

    const missing = await gql(t.yoga, `{ note(id: "${id}") { id } }`, alice);
    expect(missing.errors?.[0]?.extensions.code).toBe('NOT_FOUND');
  });

  it('protects the users operations', async () => {
    const me = await gql(t.yoga, '{ me { id } }', alice);
    const aliceId = (me.data.me as { id: string }).id;

    const anonGet = await gql(t.yoga, `{ getUser(id: "${aliceId}") { id } }`);
    expect(anonGet.errors?.[0]?.extensions.code).toBe('UNAUTHENTICATED');

    const otherGet = await gql(t.yoga, `{ getUser(id: "${aliceId}") { id } }`, bob);
    expect(otherGet.errors?.[0]?.extensions.code).toBe('FORBIDDEN');

    const selfGet = await gql(t.yoga, `{ getUser(id: "${aliceId}") { id } }`, alice);
    expect(selfGet.data.getUser).toEqual({ id: aliceId });

    const create =
      'mutation { createUser(email: "n@test.com", password: "secret123", role: "admin") { role } }';
    expect((await gql(t.yoga, create)).errors?.[0]?.extensions.code).toBe('UNAUTHENTICATED');
    expect((await gql(t.yoga, create, alice)).errors?.[0]?.extensions.code).toBe('FORBIDDEN');
  });

  it('applies the password policy to GraphQL register too', async () => {
    const r = await gql(
      t.yoga,
      'mutation { register(email: "pw@test.com", password: "short") { accessToken } }',
    );
    expect(r.errors?.[0]?.extensions.code).toBe('BAD_USER_INPUT');
  });
});
