import { toUserDTO } from '#modules/users/presentation/dto/users.dto';

import type { User } from '#modules/users/domain/user.entity';

export function toAuthPayload(user: User, accessToken: string, refreshToken: string) {
  return { accessToken, refreshToken, user: toUserDTO(user) };
}
