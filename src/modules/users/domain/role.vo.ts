import { ValidationError } from '#modules/shared/domain/error';

const ALLOWED = ['user', 'admin'] as const;
export type RoleValue = (typeof ALLOWED)[number];

export class Role {
  private constructor(readonly value: RoleValue) {}

  static create(raw: string): Role {
    if (!ALLOWED.includes(raw as RoleValue)) {
      throw new ValidationError(`Invalid role: ${raw}`);
    }
    return new Role(raw as RoleValue);
  }

  static user(): Role {
    return new Role('user');
  }
  static admin(): Role {
    return new Role('admin');
  }

  isAdmin(): boolean {
    return this.value === 'admin';
  }
  equals(other: Role): boolean {
    return this.value === other.value;
  }
  toString(): string {
    return this.value;
  }
}
