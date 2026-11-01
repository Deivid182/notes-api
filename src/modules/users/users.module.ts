import { type PasswordHasher } from '#modules/shared/domain/interfaces/password-hasher.interface';
import { BcryptPasswordHasher } from '#modules/shared/infrastructure/adapters/bcrypt-password-hasher.adapter';
import { type SharedContext } from '#modules/shared/infrastructure/config/shared-context';

import { AssignRoleUseCase } from './application/assing-role.use-case.js';
import { CreateUserUseCase } from './application/create-user.use-case.js';
import { GetUserUseCase } from './application/get-user.use-case.js';
import { type UserRepository } from './domain/user.repository.js';
import { MongoUserRepositoryImpl } from './infrastructure/mongodb/mongodb-user.repository.impl.js';
import { PostgresUserRepository } from './infrastructure/postgres/postgres.repository.impl.js';
import { SqliteUserRepositoryImpl } from './infrastructure/sqlite/sqlite-user.repository.impl.js';

export interface UsersModule {
  /** Puerto expuesto a otros módulos (nunca la implementación concreta). */
  userRepository: UserRepository;
  /** Servicio compartido: necesario para auth. */
  passwordHasher: PasswordHasher;
  useCases: {
    createUser: CreateUserUseCase;
    getUser: GetUserUseCase;
    assignRole: AssignRoleUseCase;
  };
}

export function createUsersModule(shared: SharedContext): UsersModule {
  const { env, persistence, clock } = shared;

  const userRepository = buildUserRepository(persistence);
  const passwordHasher = new BcryptPasswordHasher();

  const createUser = new CreateUserUseCase({
    userRepository,
    passwordHasher,
    clock,
    defaultRole: env.DEFAULT_USER_ROLE,
  });

  return {
    userRepository,
    passwordHasher,
    useCases: {
      createUser,
      getUser: new GetUserUseCase(userRepository),
      assignRole: new AssignRoleUseCase(userRepository, clock),
    },
  };
}

function buildUserRepository(persistence: SharedContext['persistence']): UserRepository {
  switch (persistence.engine) {
    case 'sqlite':
      return new SqliteUserRepositoryImpl(persistence.sqlite);
    case 'postgres':
      return new PostgresUserRepository(persistence.postgres);
    case 'mongodb':
      return new MongoUserRepositoryImpl(persistence.mongodb);
  }
}
