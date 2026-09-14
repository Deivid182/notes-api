import type { RefreshToken } from './refresh-token.entity.js';

export interface RefreshTokenRepository {
  findById(id: string): Promise<RefreshToken | null>;
  save(token: RefreshToken): Promise<void>;
  revokeAllForUser(userId: string, at: Date): Promise<void>;
}
