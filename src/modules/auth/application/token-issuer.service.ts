import { type TokenService } from '#modules/auth/domain/interfaces/token-service.interface';
import { RefreshToken } from '#modules/auth/domain/refresh-token.entity';
import { type RefreshTokenRepository } from '#modules/auth/domain/refresh-token.repository';
import { newUuid } from '#modules/shared/domain/uuid';

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

export class TokenIssuerService {
  constructor(
    private tokenService: TokenService,
    private refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async issue(userId: string, role: string): Promise<IssuedTokens> {
    const jti = newUuid();
    const accessToken = await this.tokenService.generateAccessToken({ sub: userId, role });
    const refreshToken = await this.tokenService.generateRefreshToken({ sub: userId, jti });
    const tokenHash = this.tokenService.hashToken(refreshToken);
    const expiresAt = this.tokenService.getRefreshTokenExpiry();

    await this.refreshTokenRepository.save(
      RefreshToken.create({
        id: jti,
        userId,
        tokenHash,
        expiresAt,
        revokedAt: null,
      }),
    );

    return { accessToken, refreshToken };
  }
}
