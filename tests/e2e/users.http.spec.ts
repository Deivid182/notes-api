import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from './helpers.js';

const t = await buildTestApp();
afterAll(() => t.close());

describe('users HTTP e2e', () => {
  let alice = { id: '', token: '', refresh: '' };
  let bob = { id: '', token: '' };
  let admin = { id: '', token: '' };

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    const reg = async (email: string) => {
      const res = await request(t.app)
        .post('/api/v1/auth/register')
        .send({ email, password: 'secret123' });
      return {
        id: res.body.data.user.id as string,
        token: res.body.data.accessToken as string,
        refresh: res.body.data.refreshToken as string,
      };
    };
    alice = await reg('alice@test.com');
    bob = await reg('bob@test.com');
    const created = await t.container.modules.users.useCases.createUser.execute({
      email: 'admin@test.com',
      password: 'secret123',
      role: 'admin',
    });
    const login = await request(t.app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.com', password: 'secret123' });
    admin = { id: created.id, token: login.body.data.accessToken };
  });

  it('requires authentication on every users route', async () => {
    const body = { email: 'x@test.com', password: 'secret123', role: 'admin' };
    expect((await request(t.app).post('/api/v1/users').send(body)).status).toBe(401);
    expect((await request(t.app).get(`/api/v1/users/${alice.id}`)).status).toBe(401);
    expect(
      (await request(t.app).post(`/api/v1/users/${alice.id}/assign-role`).send({ role: 'admin' }))
        .status,
    ).toBe(401);
  });

  it('only admin can create users', async () => {
    const body = { email: 'new@test.com', password: 'secret123', role: 'admin' };
    expect(
      (await request(t.app).post('/api/v1/users').set(auth(alice.token)).send(body)).status,
    ).toBe(403);
    const ok = await request(t.app).post('/api/v1/users').set(auth(admin.token)).send(body);
    expect(ok.status).toBe(201);
    expect(ok.body.data.role).toBe('admin');
  });

  it('users read themselves, not others; admin reads anyone', async () => {
    expect(
      (await request(t.app).get(`/api/v1/users/${alice.id}`).set(auth(alice.token))).status,
    ).toBe(200);
    expect(
      (await request(t.app).get(`/api/v1/users/${alice.id}`).set(auth(bob.token))).status,
    ).toBe(403);
    expect(
      (await request(t.app).get(`/api/v1/users/${alice.id}`).set(auth(admin.token))).status,
    ).toBe(200);
  });

  it('only admin can assign roles (no self-promotion)', async () => {
    const self = await request(t.app)
      .post(`/api/v1/users/${alice.id}/assign-role`)
      .set(auth(alice.token))
      .send({ role: 'admin' });
    expect(self.status).toBe(403);

    const ok = await request(t.app)
      .post(`/api/v1/users/${bob.id}/assign-role`)
      .set(auth(admin.token))
      .send({ role: 'admin' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.role).toBe('admin');
  });
});

describe('auth refresh e2e', () => {
  it('refreshes without an access token (it may already be expired)', async () => {
    const reg = await request(t.app)
      .post('/api/v1/auth/register')
      .send({ email: 'r@test.com', password: 'secret123' });
    const res = await request(t.app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: reg.body.data.refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it('reads the refresh token from the httpOnly cookie when the body has none', async () => {
    const reg = await request(t.app)
      .post('/api/v1/auth/register')
      .send({ email: 'cookie@test.com', password: 'secret123' });
    const setCookie = reg.headers['set-cookie'] as unknown as string[];
    expect(setCookie.some((c) => c.startsWith('refresh_token=') && c.includes('HttpOnly'))).toBe(
      true,
    );
    const cookie = setCookie.map((c) => c.split(';')[0]).join('; ');

    const res = await request(t.app).post('/api/v1/auth/refresh').set('Cookie', cookie).send({});
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it('rejects a missing or reused refresh token', async () => {
    expect((await request(t.app).post('/api/v1/auth/refresh').send({})).status).toBe(401);

    const reg = await request(t.app)
      .post('/api/v1/auth/register')
      .send({ email: 'r2@test.com', password: 'secret123' });
    const token = reg.body.data.refreshToken as string;
    expect(
      (await request(t.app).post('/api/v1/auth/refresh').send({ refreshToken: token })).status,
    ).toBe(200);
    expect(
      (await request(t.app).post('/api/v1/auth/refresh').send({ refreshToken: token })).status,
    ).toBe(401);
  });
});
