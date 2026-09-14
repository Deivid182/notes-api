import { RefreshToken } from '#modules/auth/domain/refresh-token.entity';
import { type RefreshTokenRepository } from '#modules/auth/domain/refresh-token.repository';

import type { Pool } from 'pg';

interface Row {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
}

export class PostgresRefreshTokenRepositoryImpl implements RefreshTokenRepository {
  constructor(private pool: Pool) {}

  async findById(id: string): Promise<RefreshToken | null> {
    const { rows } = await this.pool.query<Row>('SELECT * FROM refresh_tokens WHERE id = $1', [id]);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async save(token: RefreshToken): Promise<void> {
    await this.pool.query(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, revoked_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         token_hash = EXCLUDED.token_hash,
         expires_at = EXCLUDED.expires_at,
         revoked_at = EXCLUDED.revoked_at`,
      [token.id, token.userId, token.tokenHash, token.expiresAt, token.revokedAt],
    );
  }

  async revokeAllForUser(userId: string, at: Date): Promise<void> {
    await this.pool.query(
      'UPDATE refresh_tokens SET revoked_at = $1 WHERE user_id = $2 AND revoked_at IS NULL',
      [at, userId],
    );
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
