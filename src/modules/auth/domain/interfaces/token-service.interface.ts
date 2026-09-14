export interface AccessTokenPayload {
  sub: string;
  role: string;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export interface TokenService {
  generateAccessToken(payload: AccessTokenPayload): Promise<string>;
  generateRefreshToken(payload: RefreshTokenPayload): Promise<string>;
  verifyAccessToken(token: string): Promise<AccessTokenPayload>;
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;
  hashToken(token: string): string;
  getRefreshTokenExpiry(): Date;
}
