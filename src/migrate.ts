import 'dotenv/config';

import { ConsoleLogger } from '#modules/shared/infrastructure/adapters/console-logger.adapter';

import { runMigrateCli } from './migrate-cli.js';

// CLI de migraciones: `migrate [sqlite|postgres|mongodb]` (sin argumento usa `DATABASE_ENGINE`).
runMigrateCli(process.argv[2], process.env, new ConsoleLogger()).catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
