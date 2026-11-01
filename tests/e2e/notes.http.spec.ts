import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from './helpers.js';

describe('notes HTTP e2e', () => {
  const t = buildTestApp();
  let alice = '';
  let bob = '';
  let admin = '';

  const register = async (email: string) => {
    const res = await request(t.app).post('/api/v1/auth/register').send({
      email,
      password: 'secret123',
    });
    expect(res.status).toBe(201);
    return res.body.data.accessToken as string;
  };

  beforeAll(async () => {
    alice = await register('alice@test.com');
    bob = await register('bob@test.com');
    // admin: crear usuario con rol admin y emitir token vía login
    await t.container.useCases.createUser.execute({
      email: 'admin@test.com',
      password: 'secret123',
      role: 'admin',
    });
    const login = await request(t.app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.com', password: 'secret123' });
    admin = login.body.data.accessToken;
  });
  afterAll(() => t.close());

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  it('rejects unauthenticated requests', async () => {
    expect((await request(t.app).get('/api/v1/notes')).status).toBe(401);
  });

  it('runs the full CRUD flow for the owner', async () => {
    const created = await request(t.app)
      .post('/api/v1/notes')
      .set(auth(alice))
      .send({ title: ' First ', content: 'body' });
    expect(created.status).toBe(201);
    expect(created.body.data.title).toBe('First');
    const id = created.body.data.id as string;

    const got = await request(t.app).get(`/api/v1/notes/${id}`).set(auth(alice));
    expect(got.status).toBe(200);

    const patched = await request(t.app)
      .patch(`/api/v1/notes/${id}`)
      .set(auth(alice))
      .send({ content: 'new body' });
    expect(patched.status).toBe(200);
    expect(patched.body.data.content).toBe('new body');
    expect(patched.body.data.title).toBe('First');

    expect((await request(t.app).delete(`/api/v1/notes/${id}`).set(auth(alice))).status).toBe(204);
    expect((await request(t.app).get(`/api/v1/notes/${id}`).set(auth(alice))).status).toBe(404);
  });

  it('validates input', async () => {
    const res = await request(t.app).post('/api/v1/notes').set(auth(alice)).send({});
    expect(res.status).toBe(400);
    const tooLong = await request(t.app)
      .post('/api/v1/notes')
      .set(auth(alice))
      .send({ title: 'x'.repeat(151) });
    expect(tooLong.status).toBe(400);
    const empty = await request(t.app).patch('/api/v1/notes/whatever').set(auth(alice)).send({});
    expect(empty.status).toBe(400);
  });

  it('enforces ownership; admin sees everything', async () => {
    const created = await request(t.app)
      .post('/api/v1/notes')
      .set(auth(alice))
      .send({ title: 'private' });
    const id = created.body.data.id as string;

    expect((await request(t.app).get(`/api/v1/notes/${id}`).set(auth(bob))).status).toBe(403);
    expect(
      (await request(t.app).patch(`/api/v1/notes/${id}`).set(auth(bob)).send({ title: 'x' }))
        .status,
    ).toBe(403);
    expect((await request(t.app).delete(`/api/v1/notes/${id}`).set(auth(bob))).status).toBe(403);

    const bobList = await request(t.app).get('/api/v1/notes').set(auth(bob));
    expect(bobList.body.data).toHaveLength(0);

    const adminList = await request(t.app).get('/api/v1/notes').set(auth(admin));
    expect(adminList.body.data.some((n: { id: string }) => n.id === id)).toBe(true);
    expect((await request(t.app).get(`/api/v1/notes/${id}`).set(auth(admin))).status).toBe(200);
  });
});
