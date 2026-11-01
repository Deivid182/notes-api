import { describe, expect, it } from 'vitest';

import { createApp } from './app.js';
import { parseEnv } from './modules/shared/infrastructure/config/env.js';

const silent = { debug() {}, info() {}, warn() {}, error() {} };

const env = parseEnv({
  NODE_ENV: 'test',
  DATABASE_URL: ':memory:',
  JWT_ACCESS_SECRET: 'a',
  JWT_REFRESH_SECRET: 'b',
  RUN_MIGRATIONS: 'true',
  PRESENTATION_PROTOCOL: 'both',
  PORT_HTTP: '0',
  PORT_GRAPHQL: '0',
});

describe('createApp', () => {
  it('builds the container and runs migrations without opening ports', async () => {
    const app = await createApp(env, { logger: silent });
    const notes = await app.container.modules.notes.useCases.listNotes.execute({
      actor: { id: 'nobody', role: 'user' },
    });
    expect(notes).toEqual([]);
    await app.stop();
  });

  it('starts and stops idempotently', async () => {
    const app = await createApp(env, { logger: silent });
    await app.start();
    await app.start();
    await app.stop();
    await expect(app.stop()).resolves.toBeUndefined();
  });
});
