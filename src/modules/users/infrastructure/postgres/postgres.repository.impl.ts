import { type Pool } from 'pg';

import { Email } from '#modules/shared/domain/value-objects/email.vo';
import { Role } from '#modules/users/domain/role.vo';
import { User } from '#modules/users/domain/user.entity';
import { type UserRepository } from '#modules/users/domain/user.repository';

interface Row {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

export class PostgresUserRepository implements UserRepository {
  constructor(private pool: Pool) {}

  async findById(id: string): Promise<User | null> {
    const { rows } = await this.pool.query<Row>('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await this.pool.query<Row>('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async save(user: User): Promise<void> {
    await this.pool.query(
      `INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         password_hash = EXCLUDED.password_hash,
         role = EXCLUDED.role,
         updated_at = EXCLUDED.updated_at`,
      [
        user.id,
        user.email.toString(),
        user.passwordHash,
        user.role.toString(),
        user.createdAt,
        user.updatedAt,
      ],
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
