export interface RefreshTokenProps {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export class RefreshToken {
  private constructor(private props: RefreshTokenProps) {}

  static create(props: RefreshTokenProps): RefreshToken {
    return new RefreshToken({ ...props });
  }

  get id(): string {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get tokenHash(): string {
    return this.props.tokenHash;
  }
  get expiresAt(): Date {
    return this.props.expiresAt;
  }
  get revokedAt(): Date | null {
    return this.props.revokedAt;
  }

  isRevoked(): boolean {
    return this.props.revokedAt !== null;
  }
  isExpired(now: Date): boolean {
    return this.props.expiresAt.getTime() <= now.getTime();
  }
  isValid(now: Date): boolean {
    return !this.isRevoked() && !this.isExpired(now);
  }

  revoke(at: Date): void {
    this.props.revokedAt = at;
  }
}
