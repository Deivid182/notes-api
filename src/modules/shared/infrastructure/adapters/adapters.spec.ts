import { afterEach, describe, expect, it, vi } from 'vitest';

import { BcryptPasswordHasher } from './bcrypt-password-hasher.adapter.js';
import { ConsoleLogger, SilentLogger } from './console-logger.adapter.js';
import { FixedClock, SystemClock } from './system-clock.adapter.js';

afterEach(() => vi.restoreAllMocks());

describe('BcryptPasswordHasher', () => {
  const hasher = new BcryptPasswordHasher(4);

  it('hashes with a salt and verifies', async () => {
    const a = await hasher.hash('secret123');
    const b = await hasher.hash('secret123');
    expect(a).not.toBe('secret123');
    expect(a).not.toBe(b);
    expect(await hasher.compare('secret123', a)).toBe(true);
    expect(await hasher.compare('other', a)).toBe(false);
  });

  it('rejects a malformed hash instead of returning true', async () => {
    expect(await hasher.compare('secret123', 'not-a-hash')).toBe(false);
  });
});

describe('ConsoleLogger', () => {
  it('writes one JSON line per call, to the right stream', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logger = new ConsoleLogger();

    logger.debug('d');
    logger.info('i', { a: 1 });
    logger.warn('w');
    logger.error('e', { code: 'X' });

    expect(log).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(1);
    expect(JSON.parse(log.mock.calls[1]?.[0] as string)).toMatchObject({
      level: 'info',
      message: 'i',
      a: 1,
    });
    expect(JSON.parse(error.mock.calls[0]?.[0] as string)).toMatchObject({
      level: 'error',
      code: 'X',
    });
    expect(JSON.parse(warn.mock.calls[0]?.[0] as string).ts).toMatch(/^\d{4}-/);
  });

  it('SilentLogger prints nothing', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const l = new SilentLogger();
    l.debug();
    l.info();
    l.warn();
    l.error();
    expect(log).not.toHaveBeenCalled();
  });
});

describe('clocks', () => {
  it('SystemClock returns the current time', () => {
    vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') });
    expect(new SystemClock().now().toISOString()).toBe('2026-01-01T00:00:00.000Z');
    vi.useRealTimers();
  });

  it('FixedClock can be set and advanced', () => {
    const c = new FixedClock(new Date('2026-01-01T00:00:00Z'));
    c.advance(1000);
    expect(c.now().toISOString()).toBe('2026-01-01T00:00:01.000Z');
    c.set(new Date('2030-01-01T00:00:00Z'));
    expect(c.now().getUTCFullYear()).toBe(2030);
  });
});
