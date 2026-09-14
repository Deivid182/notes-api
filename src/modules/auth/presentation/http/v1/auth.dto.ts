import { type User } from '#modules/users/domain/user.entity';

export function toAuthPayload(user: User, accessToken: string, refreshToken: string) {
  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email.toString(),
      role: user.role.toString(),
    },
  };
}
