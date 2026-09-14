import { type Clock } from '#modules/shared/domain/interfaces/clock.interface';

import { type TokenService } from '../domain/interfaces/token-service.interface.js';
import { type RefreshTokenRepository } from '../domain/refresh-token.repository.js';

export interface LogoutInput {
  refreshToken?: string;
  userId?: string;
  all?: boolean;
}

export class LogoutUseCase {
  constructor(
    private tokenService: TokenService,
    private refreshTokenRepository: RefreshTokenRepository,
    private clock: Clock,
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    if (input.all && input.userId) {
      await this.refreshTokenRepository.revokeAllForUser(input.userId, this.clock.now());
      return;
    }

    if (!input.refreshToken) return;

    try {
      const payload = await this.tokenService.verifyRefreshToken(input.refreshToken);
      const record = await this.refreshTokenRepository.findById(payload.jti);
      if (record && !record.isRevoked()) {
        record.revoke(this.clock.now());
        await this.refreshTokenRepository.save(record);
      }
    } catch {
      // Token inválido: idempotente, no revela información.
    }
  }
}
