import { RefreshToken } from '#modules/auth/domain/refresh-token.entity';
import { type RefreshTokenRepository } from '#modules/auth/domain/refresh-token.repository';

import type { DatabaseSync } from 'node:sqlite';

interface Row {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
}

export class SqliteRefreshTokenRepositoryImpl implements RefreshTokenRepository {
  constructor(private db: DatabaseSync) {}

  async findById(id: string): Promise<RefreshToken | null> {
    const row = this.db.prepare('SELECT * FROM refresh_tokens WHERE id = ?').get(id) as unknown as
      Row | undefined;
    return row ? this.toEntity(row) : null;
  }

  async save(token: RefreshToken): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, revoked_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           token_hash = excluded.token_hash,
           expires_at = excluded.expires_at,
           revoked_at = excluded.revoked_at`,
      )
      .run(
        token.id,
        token.userId,
        token.tokenHash,
        token.expiresAt.toISOString(),
        token.revokedAt ? token.revokedAt.toISOString() : null,
      );
  }

  async revokeAllForUser(userId: string, at: Date): Promise<void> {
    this.db
      .prepare('UPDATE refresh_tokens SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL')
      .run(at.toISOString(), userId);
  }

  private toEntity(row: Row): RefreshToken {
    return RefreshToken.create({
      id: row.id,
      userId: row.user_id,
      tokenHash: row.token_hash,
      expiresAt: new Date(row.expires_at),
      revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
    });
  }
}
