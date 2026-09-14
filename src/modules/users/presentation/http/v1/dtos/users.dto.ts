import type { User } from '#modules/users/domain/user.entity';

export function toUserDTO(user: User) {
  return {
    id: user.id,
    email: user.email.toString(),
    role: user.role.value,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
