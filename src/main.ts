import 'dotenv/config';

import { createApp } from './app.js';
import { loadEnv } from './modules/shared/infrastructure/config/env.js';

async function main(): Promise<void> {
  const app = await createApp(loadEnv());
  await app.start();

  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    app.container.logger.info(`Received ${signal}, shutting down...`);
    await app.stop();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Fatal error during bootstrap:', err);
  process.exit(1);
});
