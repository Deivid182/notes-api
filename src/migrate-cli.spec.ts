import { describe, expect, it, vi } from 'vitest';

import { runMigrateCli } from './migrate-cli.js';

const logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const raw = { JWT_ACCESS_SECRET: 'a', JWT_REFRESH_SECRET: 'b', DATABASE_URL: ':memory:' };

describe('runMigrateCli', () => {
  it('rejects an unknown engine before touching any database', async () => {
    await expect(runMigrateCli('oracle', raw, logger)).rejects.toThrow(/Unknown engine "oracle"/);
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('falls back to DATABASE_ENGINE and applies the migrations', async () => {
    await runMigrateCli(undefined, { ...raw, DATABASE_ENGINE: 'sqlite' }, logger);
    expect(logger.info).toHaveBeenCalledWith('Running migrations', { engine: 'sqlite' });
    expect(logger.info).toHaveBeenCalledWith('sqlite migration applied: 001-init.sql');
    expect(logger.info).toHaveBeenCalledWith('Migrations finished', { engine: 'sqlite' });
  });

  it('forces migrations on even when RUN_MIGRATIONS is false', async () => {
    vi.clearAllMocks();
    await runMigrateCli('sqlite', { ...raw, RUN_MIGRATIONS: 'false' }, logger);
    expect(logger.info).toHaveBeenCalledWith('sqlite migration applied: 001-init.sql');
  });

  it('requires DATABASE_URL for the chosen engine', async () => {
    await expect(
      runMigrateCli('postgres', { JWT_ACCESS_SECRET: 'a', JWT_REFRESH_SECRET: 'b' }, logger),
    ).rejects.toThrow(/DATABASE_URL/);
  });
});
