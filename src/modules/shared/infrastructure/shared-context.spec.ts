import { describe, expect, it } from 'vitest';

import { SystemClock } from './adapters/system-clock.adapter.js';
import { parseEnv } from './config/env.js';
import { buildSharedContext } from './shared-context.js';

import type { Persistence } from './persistence/persistence.js';

const env = parseEnv({ JWT_ACCESS_SECRET: 'a', JWT_REFRESH_SECRET: 'b' });
const persistence = { engine: 'sqlite', sqlite: {} } as unknown as Persistence;

describe('buildSharedContext', () => {
  it('defaults the logger and clock', () => {
    const ctx = buildSharedContext({ env, persistence });
    expect(ctx.clock).toBeInstanceOf(SystemClock);
    expect(typeof ctx.logger.info).toBe('function');
    expect(ctx.env).toBe(env);
    expect(ctx.persistence).toBe(persistence);
  });

  it('uses the overrides when given', () => {
    const clock = { now: () => new Date(0) };
    const logger = { debug() {}, info() {}, warn() {}, error() {} };
    const ctx = buildSharedContext({ env, persistence, clock, logger });
    expect(ctx.clock).toBe(clock);
    expect(ctx.logger).toBe(logger);
  });
});
