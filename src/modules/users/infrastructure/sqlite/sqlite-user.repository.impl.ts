import { type DatabaseSync } from 'node:sqlite';

import { Email } from '#modules/shared/domain/value-objects/email.vo';
import { Role } from '#modules/users/domain/role.vo';
import { User } from '#modules/users/domain/user.entity';
import { type UserRepository } from '#modules/users/domain/user.repository';

interface Row {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export class SqliteUserRepositoryImpl implements UserRepository {
  constructor(private db: DatabaseSync) {}

  async findById(id: string): Promise<User | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown as
      Row | undefined;
    return row ? this.toEntity(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE email = ?').get(email) as unknown as
      Row | undefined;
    return row ? this.toEntity(row) : null;
  }

  async save(user: User): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           email = excluded.email,
           password_hash = excluded.password_hash,
           role = excluded.role,
           updated_at = excluded.updated_at`,
      )
      .run(
        user.id,
        user.email.toString(),
        user.passwordHash,
        user.role.toString(),
        user.createdAt.toISOString(),
        user.updatedAt.toISOString(),
      );
  }

  private toEntity(row: Row): User {
    return User.create({
      id: row.id,
      email: Email.create(row.email),
      passwordHash: row.password_hash,
      role: Role.create(row.role),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
