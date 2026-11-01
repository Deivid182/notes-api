import { UnauthorizedError } from '#modules/shared/domain/error';
import { type Clock } from '#modules/shared/domain/interfaces/clock.interface';

import {
  type RefreshTokenPayload,
  type TokenService,
} from '../domain/interfaces/token-service.interface.js';
import { type RefreshTokenRepository } from '../domain/refresh-token.repository.js';

export interface LogoutInput {
  refreshToken?: string;
  /** Usuario ya autenticado (access token válido). Opcional. */
  userId?: string;
  /** Cierra todas las sesiones del usuario. */
  all?: boolean;
}

export class LogoutUseCase {
  constructor(
    private tokenService: TokenService,
    private refreshTokenRepository: RefreshTokenRepository,
    private clock: Clock,
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    const payload = input.refreshToken ? await this.verifyRefreshToken(input.refreshToken) : null;

    if (input.all) {
      // El refresh token también identifica al usuario: no hace falta un access token vigente.
      const userId = input.userId ?? payload?.sub;
      if (!userId) throw new UnauthorizedError('Cannot identify the session to log out');
      await this.refreshTokenRepository.revokeAllForUser(userId, this.clock.now());
      return;
    }

    if (!payload) return;
    const record = await this.refreshTokenRepository.findById(payload.jti);
    if (record && !record.isRevoked()) {
      record.revoke(this.clock.now());
      await this.refreshTokenRepository.save(record);
    }
  }

  /** Token inválido: idempotente, no revela información. */
  private async verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
    try {
      return await this.tokenService.verifyRefreshToken(token);
    } catch {
      return null;
    }
  }
}
