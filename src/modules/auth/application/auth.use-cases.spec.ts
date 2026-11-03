import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';

import { ConflictError, UnauthorizedError, ValidationError } from '#modules/shared/domain/error';
import { Email } from '#modules/shared/domain/value-objects/email.vo';
import { CreateUserUseCase } from '#modules/users/application/create-user.use-case';
import { Role } from '#modules/users/domain/role.vo';
import { User } from '#modules/users/domain/user.entity';

import { JwtTokenServiceAdapter } from '../infrastructure/adapters/token-service.adapter.js';

import { LoginUseCase } from './login.use-case.js';
import { RefreshTokenUseCase } from './refresh-token.use-case.js';
import { RegisterUserUseCase } from './register-user.use-case.js';
import { TokenIssuerService } from './token-issuer.service.js';

import type { PasswordHasher } from '#modules/shared/domain/interfaces/password-hasher.interface';
import type { UserRepository } from '#modules/users/domain/user.repository';
import type { RefreshToken } from '../domain/refresh-token.entity.js';
import type { RefreshTokenRepository } from '../domain/refresh-token.repository.js';

class InMemoryUsers implements UserRepository {
  items = new Map<string, User>();
  async findById(id: string) {
    return this.items.get(id) ?? null;
  }
  async findByEmail(email: string) {
    return [...this.items.values()].find((u) => u.email.value === email) ?? null;
  }
  async save(user: User) {
    this.items.set(user.id, user);
  }
}

class InMemoryRefreshTokens implements RefreshTokenRepository {
  items = new Map<string, RefreshToken>();
  async findById(id: string) {
    return this.items.get(id) ?? null;
  }
  async save(t: RefreshToken) {
    this.items.set(t.id, t);
  }
  async revokeAllForUser() {}
}

/** Hasher determinista: suficiente para ejercitar la lógica sin el costo de bcrypt. */
const hasher: PasswordHasher = {
  hash: async (p) => `hashed:${p}`,
  compare: async (p, h) => h === `hashed:${p}`,
};

function setup(now = new Date('2026-01-01T00:00:00Z')) {
  const clock = { now: () => now };
  const users = new InMemoryUsers();
  const tokens = new InMemoryRefreshTokens();
  const tokenService = new JwtTokenServiceAdapter({
    accessSecret: 'a',
    refreshSecret: 'r',
    accessExpiresIn: '900',
    refreshExpiresIn: '604800',
  });
  const issuer = new TokenIssuerService(tokenService, tokens);
  const createUser = new CreateUserUseCase({
    userRepository: users,
    passwordHasher: hasher,
    clock,
  });
  return {
    users,
    tokens,
    tokenService,
    issuer,
    clock,
    register: new RegisterUserUseCase(createUser, issuer),
    login: new LoginUseCase(users, hasher, issuer),
    refresh: new RefreshTokenUseCase(tokenService, tokens, users, issuer, clock),
  };
}

describe('TokenIssuerService', () => {
  it('issues a pair and stores only the hash of the refresh token', async () => {
    const s = setup();
    const { accessToken, refreshToken } = await s.issuer.issue('u1', 'user');

    expect(await s.tokenService.verifyAccessToken(accessToken)).toEqual({
      sub: 'u1',
      role: 'user',
    });
    const { jti } = await s.tokenService.verifyRefreshToken(refreshToken);
    const stored = s.tokens.items.get(jti);
    expect(stored?.userId).toBe('u1');
    expect(stored?.tokenHash).toBe(s.tokenService.hashToken(refreshToken));
    expect(stored?.tokenHash).not.toBe(refreshToken);
    expect(stored?.isRevoked()).toBe(false);
  });
});

describe('RegisterUserUseCase', () => {
  it('creates a user with the default role and returns tokens', async () => {
    const s = setup();
    const out = await s.register.execute({ email: 'New@Test.com', password: 'secret123' });
    expect(out.user.email.value).toBe('new@test.com');
    expect(out.user.role.value).toBe('user');
    expect(out.accessToken).toBeTruthy();
    expect(s.tokens.items.size).toBe(1);
  });

  it('rejects a duplicate email and a weak password', async () => {
    const s = setup();
    await s.register.execute({ email: 'a@test.com', password: 'secret123' });
    await expect(
      s.register.execute({ email: 'A@test.com', password: 'secret123' }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(
      s.register.execute({ email: 'b@test.com', password: 'short' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('LoginUseCase', () => {
  it('logs in with the right credentials', async () => {
    const s = setup();
    await s.register.execute({ email: 'a@test.com', password: 'secret123' });
    const out = await s.login.execute({ email: ' A@Test.com ', password: 'secret123' });
    expect(out.user.email.value).toBe('a@test.com');
    expect(out.refreshToken).toBeTruthy();
  });

  it('gives the same error for an unknown user and a wrong password', async () => {
    const s = setup();
    await s.register.execute({ email: 'a@test.com', password: 'secret123' });
    const unknown = await s.login
      .execute({ email: 'x@test.com', password: 'secret123' })
      .catch((e: unknown) => e);
    const wrong = await s.login
      .execute({ email: 'a@test.com', password: 'nope-nope' })
      .catch((e: unknown) => e);
    expect(unknown).toBeInstanceOf(UnauthorizedError);
    expect(wrong).toBeInstanceOf(UnauthorizedError);
    expect((unknown as Error).message).toBe((wrong as Error).message);
  });

  it('does not enforce the password policy on login', async () => {
    const s = setup();
    await expect(s.login.execute({ email: 'a@test.com', password: 'x' })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it('rejects a malformed email as validation error', async () => {
    const s = setup();
    await expect(s.login.execute({ email: 'nope', password: 'secret123' })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
});

describe('RefreshTokenUseCase', () => {
  async function loggedIn() {
    const s = setup();
    await s.register.execute({ email: 'a@test.com', password: 'secret123' });
    const first = await s.login.execute({ email: 'a@test.com', password: 'secret123' });
    return { s, first };
  }

  it('rotates: returns a new pair and revokes the presented token', async () => {
    const { s, first } = await loggedIn();
    const next = await s.refresh.execute({ refreshToken: first.refreshToken });
    expect(next.refreshToken).not.toBe(first.refreshToken);
    expect(next.user.id).toBe(first.user.id);

    const { jti } = await s.tokenService.verifyRefreshToken(first.refreshToken);
    expect(s.tokens.items.get(jti)?.isRevoked()).toBe(true);
  });

  it('rejects reuse of an already rotated token', async () => {
    const { s, first } = await loggedIn();
    await s.refresh.execute({ refreshToken: first.refreshToken });
    await expect(s.refresh.execute({ refreshToken: first.refreshToken })).rejects.toThrow(
      /expired or revoked/,
    );
  });

  it('rejects garbage and tokens signed with another secret', async () => {
    const { s, first } = await loggedIn();
    await expect(s.refresh.execute({ refreshToken: 'garbage' })).rejects.toThrow(
      /Invalid refresh token/,
    );
    // Un access token no es un refresh token válido.
    await expect(s.refresh.execute({ refreshToken: first.accessToken })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it('rejects a valid signature whose record is unknown', async () => {
    const { s } = await loggedIn();
    const orphan = await s.tokenService.generateRefreshToken({ sub: 'x', jti: 'missing' });
    await expect(s.refresh.execute({ refreshToken: orphan })).rejects.toThrow(/not recognised/);
  });

  it('rejects when the stored hash does not match the token', async () => {
    const { s, first } = await loggedIn();
    const { jti } = await s.tokenService.verifyRefreshToken(first.refreshToken);
    // Misma firma y jti, pero otro token (claim extra) → su hash no coincide con el guardado.
    const forged = jwt.sign({ sub: first.user.id, jti, extra: 1 }, 'r');
    await expect(s.refresh.execute({ refreshToken: forged })).rejects.toThrow(/mismatch/);
  });

  it('rejects an expired record', async () => {
    const { s, first } = await loggedIn();
    const late = new RefreshTokenUseCase(s.tokenService, s.tokens, s.users, s.issuer, {
      now: () => new Date('2099-01-01T00:00:00Z'),
    });
    await expect(late.execute({ refreshToken: first.refreshToken })).rejects.toThrow(
      /expired or revoked/,
    );
  });

  it('rejects when the user no longer exists', async () => {
    const { s, first } = await loggedIn();
    s.users.items.delete(first.user.id);
    await expect(s.refresh.execute({ refreshToken: first.refreshToken })).rejects.toThrow(
      /User not found/,
    );
  });

  it('keeps the role of the user in the new access token', async () => {
    const s = setup();
    const admin = User.create({
      id: 'root',
      email: Email.create('root@test.com'),
      passwordHash: 'hashed:secret123',
      role: Role.admin(),
      createdAt: s.clock.now(),
      updatedAt: s.clock.now(),
    });
    await s.users.save(admin);
    const first = await s.login.execute({ email: 'root@test.com', password: 'secret123' });
    const next = await s.refresh.execute({ refreshToken: first.refreshToken });
    expect((await s.tokenService.verifyAccessToken(next.accessToken)).role).toBe('admin');
  });
});
