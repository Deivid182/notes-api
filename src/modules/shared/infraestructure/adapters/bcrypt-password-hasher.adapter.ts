import bcrypt from 'bcrypt';

import { type PasswordHasher } from '#modules/shared/domain/interfaces/password-hasher.interface';

export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private rounds = 10) {}

  hash(plain: string): Promise<string> {
    return new Promise((resolve, reject) => {
      bcrypt.hash(plain, this.rounds, (err, hash) => (err ? reject(err) : resolve(hash)));
    });
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      bcrypt.compare(plain, hash, (err, ok) => (err ? reject(err) : resolve(ok)));
    });
  }
}
