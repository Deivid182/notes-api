import type { Logger } from '#modules/shared/domain/interfaces/logger.interface';
import type { Db } from 'mongodb';

export async function runMongoMigrations(db: Db, logger: Logger): Promise<void> {
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('notes').createIndex({ ownerId: 1 });
  await db.collection('refresh_tokens').createIndex({ userId: 1 });
  logger.info('mongodb indexes ensured');
}
