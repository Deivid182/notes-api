import { NotFoundError } from '#modules/shared/domain/error';
import { type Clock } from '#modules/shared/domain/interfaces/clock.interface';

import { Role } from '../domain/role.vo.js';
import { type User } from '../domain/user.entity.js';
import { type UserRepository } from '../domain/user.repository.js';

export class AssignRoleUseCase {
  constructor(
    private userRepository: UserRepository,
    private clock: Clock,
  ) {}

  async execute(input: { userId: string; role: string }): Promise<User> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) throw new NotFoundError('User not found');
    user.changeRole(Role.create(input.role), this.clock.now());
    await this.userRepository.save(user);
    return user;
  }
}
