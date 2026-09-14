import { UnauthorizedError } from '#modules/shared/domain/error';
import { type Clock } from '#modules/shared/domain/interfaces/clock.interface';
import { type User } from '#modules/users/domain/user.entity';
import { type UserRepository } from '#modules/users/domain/user.repository';

import { type TokenService } from '../domain/interfaces/token-service.interface.js';
import { type RefreshTokenRepository } from '../domain/refresh-token.repository.js';

import { type IssuedTokens, type TokenIssuerService } from './token-issuer.service.js';

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenOutput extends IssuedTokens {
  user: User;
}

export class RefreshTokenUseCase {
  constructor(
    private tokenService: TokenService,
    private refreshTokenRepository: RefreshTokenRepository,
    private userRepository: UserRepository,
    private tokenIssuer: TokenIssuerService,
    private clock: Clock,
  ) {}

  async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    let payload;
    try {
      payload = await this.tokenService.verifyRefreshToken(input.refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const record = await this.refreshTokenRepository.findById(payload.jti);
    if (!record) throw new UnauthorizedError('Refresh token not recognised');

    const now = this.clock.now();
    if (!record.isValid(now)) throw new UnauthorizedError('Refresh token expired or revoked');

    const expectedHash = this.tokenService.hashToken(input.refreshToken);
    if (expectedHash !== record.tokenHash) {
      throw new UnauthorizedError('Refresh token mismatch');
    }

    // Rotación: revoca el token actual antes de emitir uno nuevo.
    record.revoke(now);
    await this.refreshTokenRepository.save(record);

    const user = await this.userRepository.findById(payload.sub);
    if (!user) throw new UnauthorizedError('User not found');

    const tokens = await this.tokenIssuer.issue(user.id, user.role.toString());
    return { user, ...tokens };
  }
}
