import type { User } from '#modules/users/domain/user.entity';

export interface MappedUser {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export function mapUser(user: User): MappedUser {
  return {
    id: user.id,
    email: user.email.value,
    role: user.role.value,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
