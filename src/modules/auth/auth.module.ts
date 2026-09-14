import { type SharedContext } from '#modules/shared/infrastructure/config/shared-context';
import { type UsersModule } from '#modules/users/users.module';

import { LoginUseCase } from './application/login.use-case.js';
import { LogoutUseCase } from './application/logout.use-case.js';
import { RefreshTokenUseCase } from './application/refresh-token.use-case.js';
import { RegisterUserUseCase } from './application/register-user.use-case.js';
import { TokenIssuerService } from './application/token-issuer.service.js';
import { type TokenService } from './domain/interfaces/token-service.interface.js';
import { type RefreshTokenRepository } from './domain/refresh-token.repository.js';
import { JwtTokenServiceAdapter } from './infrastructure/adapters/token-service.adapter.js';
import { MongoRefreshTokenRepositoryImpl } from './infrastructure/persistence/mongodb/mongo-refresh-token.repository.impl.js';
import { PostgresRefreshTokenRepositoryImpl } from './infrastructure/persistence/postgres/postgres-refresh-token.repository.impl.js';
import { SqliteRefreshTokenRepositoryImpl } from './infrastructure/persistence/sqlite/sqlite-refresh-token.repository.impl.js';

export interface AuthModule {
  tokenService: TokenService;
  useCases: {
    registerUser: RegisterUserUseCase;
    login: LoginUseCase;
    refreshToken: RefreshTokenUseCase;
    logout: LogoutUseCase;
  };
}

export interface CreateAuthModuleDeps {
  shared: SharedContext;
  users: UsersModule;
}

export function createAuthModule({ shared, users }: CreateAuthModuleDeps): AuthModule {
  const { env, persistence, clock } = shared;

  const tokenService = new JwtTokenServiceAdapter({
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });

  const refreshTokenRepository = buildRefreshTokenRepository(env, persistence);
  const tokenIssuer = new TokenIssuerService(tokenService, refreshTokenRepository, clock);

  // Reutiliza el CreateUserUseCase y PasswordHasher del módulo users.
  const registerUser = new RegisterUserUseCase(users.useCases.createUser, tokenIssuer);

  const login = new LoginUseCase(users.userRepository, users.passwordHasher, tokenIssuer);

  const refreshToken = new RefreshTokenUseCase(
    tokenService,
    refreshTokenRepository,
    users.userRepository,
    tokenIssuer,
    clock,
  );

  const logout = new LogoutUseCase(tokenService, refreshTokenRepository, clock);

  return {
    tokenService,
    useCases: { registerUser, login, refreshToken, logout },
  };
}

function buildRefreshTokenRepository(
  env: SharedContext['env'],
  persistence: SharedContext['persistence'],
): RefreshTokenRepository {
  switch (env.DATABASE_ENGINE) {
    case 'sqlite': {
      if (!persistence.sqlite) throw new Error('sqlite persistence missing');
      return new SqliteRefreshTokenRepositoryImpl(persistence.sqlite);
    }
    case 'postgres': {
      if (!persistence.postgres) throw new Error('postgres persistence missing');
      return new PostgresRefreshTokenRepositoryImpl(persistence.postgres);
    }
    case 'mongodb': {
      if (!persistence.mongodb) throw new Error('mongodb persistence missing');
      return new MongoRefreshTokenRepositoryImpl(persistence.mongodb);
    }
  }
}
