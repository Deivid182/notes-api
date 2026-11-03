import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';

import { buildTestApp, gql } from './helpers.js';

const t = await buildTestApp();
afterAll(() => t.close());

describe('auth flow e2e (HTTP)', () => {
  const creds = { email: 'flow@test.com', password: 'secret123' };

  it('rejects a duplicated register with 409 and a wrong password with 401', async () => {
    expect((await request(t.app).post('/api/v1/auth/register').send(creds)).status).toBe(201);

    const dup = await request(t.app).post('/api/v1/auth/register').send(creds);
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('CONFLICT');

    // El email se normaliza: mayúsculas tampoco crean un segundo usuario.
    const upper = await request(t.app)
      .post('/api/v1/auth/register')
      .send({ ...creds, email: 'FLOW@test.com' });
    expect(upper.status).toBe(409);

    const bad = await request(t.app)
      .post('/api/v1/auth/login')
      .send({ ...creds, password: 'wrong-password' });
    expect(bad.status).toBe(401);
    expect(bad.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('auth flow e2e (GraphQL)', () => {
  it('registers, logs in, refreshes, reads me and logs out', async () => {
    const email = 'gflow@test.com';
    const reg = await gql(
      t.yoga,
      `mutation { register(email: "${email}", password: "secret123") { statusCode data { user { id email } } } }`,
    );
    expect(reg.data.register?.statusCode).toBe(201);

    const dup = await gql(
      t.yoga,
      `mutation { register(email: "${email}", password: "secret123") { data { user { id } } } }`,
    );
    expect(dup.errors?.[0]?.extensions.code).toBe('CONFLICT');

    const login = await gql(
      t.yoga,
      `mutation { login(email: "${email}", password: "secret123") { data { accessToken refreshToken } } }`,
    );
    const tokens = (login.data.login as { data: { accessToken: string; refreshToken: string } })
      .data;

    const me = await gql(t.yoga, '{ me { data { email } } }', tokens.accessToken);
    expect(me.data.me?.data).toEqual({ email });

    const refreshed = await gql(
      t.yoga,
      `mutation { refreshToken(refreshToken: "${tokens.refreshToken}") { data { accessToken refreshToken } } }`,
    );
    const next = (
      refreshed.data.refreshToken as { data: { accessToken: string; refreshToken: string } }
    ).data;
    expect(next.refreshToken).not.toBe(tokens.refreshToken);

    // El refresh token rotado ya no sirve.
    const reused = await gql(
      t.yoga,
      `mutation { refreshToken(refreshToken: "${tokens.refreshToken}") { data { accessToken } } }`,
    );
    expect(reused.errors?.[0]?.extensions.code).toBe('UNAUTHORIZED');

    const out = await gql(t.yoga, 'mutation { logout { success message data } }', next.accessToken);
    expect(out.data.logout).toMatchObject({ success: true, message: 'Logged out', data: null });

    const afterLogout = await gql(
      t.yoga,
      `mutation { refreshToken(refreshToken: "${next.refreshToken}") { data { accessToken } } }`,
    );
    expect(afterLogout.errors?.[0]?.extensions.code).toBe('UNAUTHORIZED');
  });
});
