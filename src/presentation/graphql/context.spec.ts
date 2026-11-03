import { describe, expect, it } from 'vitest';

import { buildContext } from './context.js';

import type { Container } from '#app/container';

const container = {
  modules: {
    auth: {
      tokenService: {
        async verifyAccessToken(token: string) {
          if (token !== 'good') throw new Error('bad');
          return { sub: 'u1', role: 'admin' };
        },
      },
    },
  },
} as unknown as Container;

const request = (authorization?: string) =>
  new Request('http://localhost/graphql', {
    headers: authorization ? { authorization } : {},
  });

describe('buildContext', () => {
  it('resolves the actor from a valid bearer token', async () => {
    const ctx = await buildContext({ container }, request('Bearer good'));
    expect(ctx.user).toEqual({ id: 'u1', role: 'admin' });
    expect(ctx.container).toBe(container);
  });

  it.each([[undefined], ['Basic good'], ['Bearer bad']])(
    'is anonymous without a valid bearer token (%s)',
    async (header) => {
      expect((await buildContext({ container }, request(header))).user).toBeNull();
    },
  );
});
