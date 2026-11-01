import { Pool } from 'pg';

export function connectPostgres(url: string): Pool {
  return new Pool({ connectionString: url });
}
