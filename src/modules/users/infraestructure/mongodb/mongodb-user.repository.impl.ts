import { Email } from '#modules/shared/domain/value-objects/email.vo';
import { Role } from '#modules/users/domain/role.vo';
import { User } from '#modules/users/domain/user.entity';
import { type UserRepository } from '#modules/users/domain/user.repository';

import type { Collection, Db } from 'mongodb';

interface UserDoc {
  _id: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export class MongoUserRepositoryImpl implements UserRepository {
  private collection: Collection<UserDoc>;

  constructor(db: Db) {
    this.collection = db.collection<UserDoc>('users');
  }

  async findById(id: string): Promise<User | null> {
    const doc = await this.collection.findOne({ _id: id });
    return doc ? this.toEntity(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.collection.findOne({ email });
    return doc ? this.toEntity(doc) : null;
  }

  async save(user: User): Promise<void> {
    const doc: UserDoc = {
      _id: user.id,
      email: user.email.toString(),
      passwordHash: user.passwordHash,
      role: user.role.toString(),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    await this.collection.replaceOne({ _id: doc._id }, doc, { upsert: true });
  }

  private toEntity(doc: UserDoc): User {
    return User.create({
      id: doc._id,
      email: Email.create(doc.email),
      passwordHash: doc.passwordHash,
      role: Role.create(doc.role),
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    });
  }
}
