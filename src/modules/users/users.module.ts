import { type PasswordHasher } from '#modules/shared/domain/interfaces/password-hasher.interface';
import { BcryptPasswordHasher } from '#modules/shared/infraestructure/adapters/bcrypt-password-hasher.adapter';
import { type SharedContext } from '#modules/shared/infraestructure/config/shared-context';

import { AssignRoleUseCase } from './application/assing-role.use-case.js';
import { CreateUserUseCase } from './application/create-user.use-case.js';
import { GetUserUseCase } from './application/get-user.use-case.js';
import { type UserRepository } from './domain/user.repository.js';
import { MongoUserRepositoryImpl } from './infraestructure/mongodb/mongodb-user.repository.impl.js';
import { PostgresUserRepository } from './infraestructure/postgres/postgres.repository.impl.js';
import { SqliteUserRepositoryImpl } from './infraestructure/sqlite/sqlite-user.repository.impl.js';

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

  const userRepository = buildUserRepository(env, persistence);
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

function buildUserRepository(
  env: SharedContext['env'],
  persistence: SharedContext['persistence'],
): UserRepository {
  const repositoryMap: Record<SharedContext['env']['DATABASE_ENGINE'], () => UserRepository> = {
    sqlite: () => {
      if (!persistence.sqlite) throw new Error('sqlite persistence missing');
      return new SqliteUserRepositoryImpl(persistence.sqlite);
    },
    postgres: () => {
      if (!persistence.postgres) throw new Error('postgres persistence missing');
      return new PostgresUserRepository(persistence.postgres);
    },
    mongodb: () => {
      if (!persistence.mongodb) throw new Error('mongodb persistence missing');
      return new MongoUserRepositoryImpl(persistence.mongodb);
    },
  };

  const repositoryFactory = repositoryMap[env.DATABASE_ENGINE];
  if (!repositoryFactory) {
    throw new Error(`Unsupported database engine: ${env.DATABASE_ENGINE}`);
  }
  return repositoryFactory();
}
