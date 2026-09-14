import { type CreateUserUseCase } from '#modules/users/application/create-user.use-case';

import { type IssuedTokens, type TokenIssuerService } from './token-issuer.service.js';

import type { User } from '../../users/domain/user.entity.js';

export interface RegisterUserInput {
  email: string;
  password: string;
}

export interface RegisterUserOutput extends IssuedTokens {
  user: User;
}

export class RegisterUserUseCase {
  constructor(
    private createUser: CreateUserUseCase,
    private tokenIssuer: TokenIssuerService,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    // El rol nunca se acepta desde la entrada pública: se aplica el default (spec §5.3).
    const user = await this.createUser.execute({ email: input.email, password: input.password });
    const tokens = await this.tokenIssuer.issue(user.id, user.role.toString());
    return { user, ...tokens };
  }
}
