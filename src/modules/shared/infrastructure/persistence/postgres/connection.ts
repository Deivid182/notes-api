import { Pool } from 'pg';

import type { Logger } from '#modules/shared/domain/interfaces/logger.interface';

export interface PostgresOptions {
  /** Conexiones máximas del pool. */
  max: number;
  /** Tiempo máximo (ms) para obtener una conexión antes de fallar. */
  connectionTimeoutMillis: number;
}

export function connectPostgres(url: string, logger: Logger, options: PostgresOptions): Pool {
  const pool = new Pool({ connectionString: url, ...options });
  // Un error en una conexión inactiva se emite en el pool: sin handler tumbaría el proceso.
  pool.on('error', (err) => {
    logger.error('postgres idle client error', { message: err.message });
  });
  return pool;
}
