import { UnauthorizedError } from '#modules/shared/domain/error';
import { type PasswordHasher } from '#modules/shared/domain/interfaces/password-hasher.interface';
import { Email } from '#modules/shared/domain/value-objects/email.vo';
import { type User } from '#modules/users/domain/user.entity';
import { type UserRepository } from '#modules/users/domain/user.repository';

import { type IssuedTokens, type TokenIssuerService } from './token-issuer.service.js';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput extends IssuedTokens {
  user: User;
}

export class LoginUseCase {
  constructor(
    private userRepository: UserRepository,
    private passwordHasher: PasswordHasher,
    private tokenIssuer: TokenIssuerService,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const email = Email.create(input.email);
    const user = await this.userRepository.findByEmail(email.toString());
    if (!user) throw new UnauthorizedError('Invalid credentials');

    const ok = await this.passwordHasher.compare(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedError('Invalid credentials');

    const tokens = await this.tokenIssuer.issue(user.id, user.role.toString());
    return { user, ...tokens };
  }
}
