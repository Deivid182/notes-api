import { ConflictError } from '#modules/shared/domain/error';
import { newUuid } from '#modules/shared/domain/uuid';
import { Email } from '#modules/shared/domain/value-objects/email.vo';

import { Role } from '../domain/role.vo.js';
import { User } from '../domain/user.entity.js';

import type { Clock } from '#modules/shared/domain/interfaces/clock.interface';
import type { PasswordHasher } from '#modules/shared/domain/interfaces/password-hasher.interface';
import type { UserRepository } from '../domain/user.repository.js';

export interface CreateUserInput {
  email: string;
  password: string;
  role?: string;
}

export interface CreateUserDeps {
  userRepository: UserRepository;
  passwordHasher: PasswordHasher;
  clock: Clock;
  defaultRole?: string;
}

export class CreateUserUseCase {
  constructor(private deps: CreateUserDeps) {}

  async execute(input: CreateUserInput): Promise<User> {
    const email = Email.create(input.email);
    const existing = await this.deps.userRepository.findByEmail(email.toString());
    if (existing) throw new ConflictError('Email already registered');

    const passwordHash = await this.deps.passwordHasher.hash(input.password);
    const role = input.role
      ? Role.create(input.role)
      : Role.create(this.deps.defaultRole ?? 'user');

    const now = this.deps.clock.now();
    const user = User.create({
      id: newUuid(),
      email,
      passwordHash,
      role,
      createdAt: now,
      updatedAt: now,
    });

    await this.deps.userRepository.save(user);
    return user;
  }
}
