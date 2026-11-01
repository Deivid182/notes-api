import { type Actor } from '#modules/shared/domain/actor';
import { NotFoundError } from '#modules/shared/domain/error';
import { type Clock } from '#modules/shared/domain/interfaces/clock.interface';

import { Role } from '../domain/role.vo.js';
import { type User } from '../domain/user.entity.js';
import { type UserRepository } from '../domain/user.repository.js';

import { assertIsAdmin } from './authorization.js';

export interface AssignRoleInput {
  actor: Actor;
  userId: string;
  role: string;
}

export class AssignRoleUseCase {
  constructor(
    private userRepository: UserRepository,
    private clock: Clock,
  ) {}

  async execute(input: AssignRoleInput): Promise<User> {
    assertIsAdmin(input.actor);
    const role = Role.create(input.role);
    const user = await this.userRepository.findById(input.userId);
    if (!user) throw new NotFoundError('User not found');
    user.changeRole(role, this.clock.now());
    await this.userRepository.save(user);
    return user;
  }
}
