import { buildContainer } from '#app/container';
import { parseEnv } from '#modules/shared/infrastructure/config/env';
import { bootstrapPersistence } from '#modules/shared/infrastructure/persistence/bootstrap';
import { buildSharedContext } from '#modules/shared/infrastructure/shared-context';

import type { TestDatabase } from './test-database.js';

const silent = { debug() {}, info() {}, warn() {}, error() {} };

/** Container real (migraciones incluidas) sobre la base aislada `db`, sin servidores. */
export async function openContainer(db: TestDatabase) {
  const env = parseEnv({ ...process.env, ...db.env, RUN_MIGRATIONS: 'true' });
  const handle = await bootstrapPersistence(env, silent);
  const container = buildContainer({
    shared: buildSharedContext({ env, persistence: handle.persistence, logger: silent }),
  });
  return { container, close: handle.shutdown };
}
