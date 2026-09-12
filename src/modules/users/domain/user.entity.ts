import type { Email } from '#modules/shared/domain/value-objects/email.vo';
import type { Role } from './role.vo.js';

export interface UserProps {
  id: string;
  email: Email;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(private props: UserProps) {}

  static create(props: UserProps): User {
    return new User({ ...props });
  }

  get id(): string {
    return this.props.id;
  }
  get email(): Email {
    return this.props.email;
  }
  get passwordHash(): string {
    return this.props.passwordHash;
  }
  get role(): Role {
    return this.props.role;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isAdmin(): boolean {
    return this.props.role.isAdmin();
  }

  changeRole(role: Role, at: Date): void {
    this.props.role = role;
    this.props.updatedAt = at;
  }
}
