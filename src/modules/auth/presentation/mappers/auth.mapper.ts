import { mapUser } from '#modules/users/presentation/mappers/user.mapper';

import type { User } from '#modules/users/domain/user.entity';
import type { MappedUser } from '#modules/users/presentation/mappers/user.mapper';

export interface MappedAuthPayload {
  accessToken: string;
  refreshToken: string;
  user: MappedUser;
}

export function mapAuthPayload(
  user: User,
  accessToken: string,
  refreshToken: string,
): MappedAuthPayload {
  return { accessToken, refreshToken, user: mapUser(user) };
}
