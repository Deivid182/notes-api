import { NotFoundError } from '#modules/shared/domain/error';

import type { User } from '../domain/user.entity.js';
import type { UserRepository } from '../domain/user.repository.js';

export class GetUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }
}
