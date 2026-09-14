import { createHash } from 'node:crypto';

import jwt, { type SignOptions } from 'jsonwebtoken';

import type {
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenService,
} from '../../domain/interfaces/token-service.interface.js';

export interface JwtTokenServiceAdapterConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
}

export class JwtTokenServiceAdapter implements TokenService {
  constructor(private cfg: JwtTokenServiceAdapterConfig) {}

  async generateAccessToken(payload: AccessTokenPayload): Promise<string> {
    return jwt.sign(payload, this.cfg.accessSecret, {
      expiresIn: this.cfg.accessExpiresIn as SignOptions['expiresIn'],
    });
  }

  async generateRefreshToken(payload: RefreshTokenPayload): Promise<string> {
    return jwt.sign(payload, this.cfg.refreshSecret, {
      expiresIn: this.cfg.refreshExpiresIn as SignOptions['expiresIn'],
    });
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const decoded = jwt.verify(token, this.cfg.accessSecret) as jwt.JwtPayload & AccessTokenPayload;
    return { sub: String(decoded.sub), role: String(decoded.role) };
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    const decoded = jwt.verify(token, this.cfg.refreshSecret) as jwt.JwtPayload &
      RefreshTokenPayload;
    return { sub: String(decoded.sub), jti: String(decoded.jti) };
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  getRefreshTokenExpiry(): Date {
    return new Date(Date.now() + parseDurationMs(this.cfg.refreshExpiresIn));
  }
}

function parseDurationMs(input: string): number {
  const m = /^(\d+)([smhd])$/.exec(input.trim());
  if (!m) {
    const n = Number(input);
    if (!Number.isNaN(n)) return n * 1000;
    return 7 * 24 * 60 * 60 * 1000;
  }
  const value = Number(m[1]);
  const unit = m[2];
  const factor: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return value * (factor[unit!] ?? 1000);
}
