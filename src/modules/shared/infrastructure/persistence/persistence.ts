import type { Db } from 'mongodb';
import type { DatabaseSync } from 'node:sqlite';
import type { Pool } from 'pg';

/** Conexión del motor activo. Discriminada por `engine`: no hay estados "a medio configurar". */
export type Persistence =
  | { engine: 'sqlite'; sqlite: DatabaseSync }
  | { engine: 'postgres'; postgres: Pool }
  | { engine: 'mongodb'; mongodb: Db };
