import { type Clock } from '#modules/shared/domain/interfaces/clock.interface';
import { type Logger } from '#modules/shared/domain/interfaces/logger.interface';

import { ConsoleLogger } from '../adapters/console-logger.adapter.js';
import { SystemClock } from '../adapters/system-clock.adapter.js';

import type { Env } from './env.js';
import type { Db } from 'mongodb';
import type { DatabaseSync } from 'node:sqlite';
import type { Pool } from 'pg';

export interface Persistence {
  sqlite?: DatabaseSync;
  postgres?: Pool;
  mongodb?: Db;
}

export interface SharedContext {
  env: Env;
  logger: Logger;
  clock: Clock;
  persistence: Persistence;
}

export interface BuildSharedContextOptions {
  env: Env;
  persistence: Persistence;
  logger?: Logger;
  clock?: Clock;
}

export function buildSharedContext(opts: BuildSharedContextOptions): SharedContext {
  return {
    env: opts.env,
    logger: opts.logger ?? new ConsoleLogger(),
    clock: opts.clock ?? new SystemClock(),
    persistence: opts.persistence,
  };
}
