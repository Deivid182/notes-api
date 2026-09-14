import { RefreshToken } from '#modules/auth/domain/refresh-token.entity';
import { type RefreshTokenRepository } from '#modules/auth/domain/refresh-token.repository';

import type { Collection, Db } from 'mongodb';

interface RefreshTokenDoc {
  _id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export class MongoRefreshTokenRepositoryImpl implements RefreshTokenRepository {
  private collection: Collection<RefreshTokenDoc>;

  constructor(db: Db) {
    this.collection = db.collection<RefreshTokenDoc>('refresh_tokens');
  }

  async findById(id: string): Promise<RefreshToken | null> {
    const doc = await this.collection.findOne({ _id: id });
    return doc ? this.toEntity(doc) : null;
  }

  async save(token: RefreshToken): Promise<void> {
    const doc: RefreshTokenDoc = {
      _id: token.id,
      userId: token.userId,
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt,
      revokedAt: token.revokedAt,
    };
    await this.collection.replaceOne({ _id: doc._id }, doc, { upsert: true });
  }

  async revokeAllForUser(userId: string, at: Date): Promise<void> {
    await this.collection.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: at } });
  }

  private toEntity(doc: RefreshTokenDoc): RefreshToken {
    return RefreshToken.create({
      id: doc._id,
      userId: doc.userId,
      tokenHash: doc.tokenHash,
      expiresAt: new Date(doc.expiresAt),
      revokedAt: doc.revokedAt ? new Date(doc.revokedAt) : null,
    });
  }
}
