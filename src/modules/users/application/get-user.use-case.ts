import { NotFoundError } from '#modules/shared/domain/error';

import { assertCanViewUser } from './authorization.js';

import type { Actor } from '#modules/shared/domain/actor';
import type { User } from '../domain/user.entity.js';
import type { UserRepository } from '../domain/user.repository.js';

export interface GetUserInput {
  actor: Actor;
  userId: string;
}

export class GetUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(input: GetUserInput): Promise<User> {
    // Autoriza antes de consultar: no revela si el id existe a quien no puede verlo.
    assertCanViewUser(input.userId, input.actor);
    const user = await this.userRepository.findById(input.userId);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }
}
