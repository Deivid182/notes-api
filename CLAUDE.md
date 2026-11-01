# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

pnpm, Node >=24 (uses `node:sqlite`), ESM TypeScript (`NodeNext`).

- `pnpm dev` — `tsx watch src/main.ts`
- `pnpm build` / `pnpm start` — tsc to `dist/`, run `dist/main.js`
- `pnpm lint` / `pnpm lint:fix`, `pnpm typecheck`, `pnpm format`
- `pnpm test:unit` (`src/**/*.spec.ts`), `pnpm test:integration` (`tests/integration`, empty), `pnpm test:e2e` (`tests/e2e`)
- Single test: `pnpm vitest run --project unit path/to/file.spec.ts` (add `-t "name"` to filter)
- `pnpm migrate` (or `migrate:sqlite|postgres|mongodb`) — `src/migrate.ts` CLI, applies pending migrations for `DATABASE_ENGINE` (or the engine arg) and exits
- `make docker-up` / `docker-down` — compose stack
- Husky: pre-commit = lint-staged; pre-push = typecheck + lint + unit tests; commit-msg = commitlint (conventional commits).
- JWT `*_EXPIRES_IN` bare numbers = seconds (adapter converts; jsonwebtoken would read ms).
- Env: copy `.env.example` to `.env`. Validated by zod in `src/modules/shared/infrastructure/config/env.ts`.

## Architecture

Modular monolith, hexagonal/DDD-style. Modules under `src/modules/`: `users`, `auth`, `notes`, `shared`. Each module layers `domain/` (entities, VOs, repository interfaces) → `application/` (use cases) → `infrastructure/` (repository impls per DB engine, adapters) → `presentation/` (`http/v1` Express 5 + zod schemas/DTOs, `graphql` typedefs + resolvers).

- **Composition root**: each module has `<name>.module.ts` exporting `createXModule(deps)` that wires use cases and picks its repository impl with an exhaustive `switch (persistence.engine)`. `Persistence` (`shared-context.ts`) is a discriminated union `{engine:'sqlite', sqlite} | {engine:'postgres', postgres} | {engine:'mongodb', mongodb}`. `buildContainer` builds modules in dependency order (users → auth; notes independent) and exposes a single access path: `container.modules.<module>.useCases` (no flat `container.useCases`). HTTP routers/controllers receive only their `useCases` (+ `tokenService`) and are assembled in `shared/presentation/http/v1/app.ts`; GraphQL resolvers reach use cases via `ctx.container.modules.*`. New module: add to `Container`, build order and `app.ts`/`schema.ts`.
- **Bootstrap**: `src/main.ts` is a thin entry (dotenv → `loadEnv` → `createApp(env).start()` → signal handlers → `app.stop()`). `src/app.ts` `createApp` is the composition root with no network side effects: `bootstrapPersistence` (`shared/infrastructure/persistence/bootstrap.ts`) → `buildSharedContext` → `buildContainer` → `createHttpApp` (Express) + `createGraphQLServer` (Yoga). Only `app.start()` opens ports, per `PRESENTATION_PROTOCOL` (`http|graphql|both`); `app.stop()` closes in reverse order and is idempotent. e2e tests use the same `createApp`. All three engines are wired: sqlite (`connectSqlite`), postgres (`pg` Pool), mongodb (`connectMongo(DATABASE_URL, DATABASE_NAME)`). `RUN_MIGRATIONS` (`true|false|1|0`) runs the engine's migrations: SQL files in `persistence/{sqlite,postgres}/migrations/` or index creation in `persistence/mongodb/migrate.ts`.
- **Shared kernel** (`modules/shared`): ports (`Clock`, `Logger`, `PasswordHasher`, `UseCase`), `Email` VO, domain errors (`domain/error.ts`) mapped to HTTP by `error.middleware.ts`, SQLite connection + SQL migrations (`persistence/sqlite/migrations/*.sql`).
- **Auth**: JWT access + refresh tokens; `TokenIssuerService` issues and persists refresh tokens; `RegisterUserUseCase` reuses users' `CreateUserUseCase`. Auth middleware in `auth/presentation/http/v1/middlewares`.
- **Errors and DTOs**: use cases/resolvers just throw `DomainError`s. HTTP: Express 5 forwards async rejections, so controllers have no try/catch; `error.middleware.ts` maps `code` → status. GraphQL: one `createMaskError(logger)` (`graphql/helpers.ts`, wired as yoga `maskedErrors.maskError`) maps `DomainError` → `GraphQLError` code; unexpected errors are logged and hidden; `requireUser`/`requireAdmin` throw ready-made `GraphQLError`s. Output DTO mappers live in `<module>/presentation/dto/` (shared by HTTP and GraphQL; one user shape via `toUserDTO`, `toAuthPayload` reuses it). Request body types come from `z.infer` exported next to each zod schema.
- **Value objects**: `create()` applies business rules; `restore()` rehydrates stored values without revalidating (repositories use `restore`). Password policy (>=8 chars, <=72 bytes) lives only in `users/domain/password.vo.ts`, applied by `CreateUserUseCase`; zod schemas only check shape and login doesn't enforce it.
- **Users authz**: all `/api/v1/users` routes need a bearer token. `POST /users` and GraphQL `createUser` are admin-only (`requireRole('admin')` / `requireAdmin(ctx)`; guarded in presentation because `CreateUserUseCase` is also used by public register). `GetUserUseCase` (self or admin) and `AssignRoleUseCase` (admin) take an `Actor` and check `users/application/authorization.ts`. `Actor` lives in `shared/domain/actor.ts`; HTTP controllers get it via `actorOf(req)`. `/auth/refresh` is public (refresh token is the credential). `/auth/logout` accepts an optional access token (`OptionalAuthMiddleware`; invalid/expired = anonymous); the refresh token (body or `refresh_token` cookie, parsed by `cookie-parser`) is enough to log out, and `all: true` identifies the user from it when no valid access token is sent.
- **Notes**: use cases take an `Actor` (`application/actor.ts`) and check `authorization.ts` (owner or admin). `listNotes` returns all notes for admins, own notes otherwise. HTTP `/api/v1/notes` (all routes need bearer token) and GraphQL `notes`/`note`/`createNote`/`updateNote`/`deleteNote`; GraphQL auth via `requireUser(ctx)`.
- **Tests**: unit specs sit next to source (`*.spec.ts`); e2e (`tests/e2e`) builds the real app via `createApp` on in-memory SQLite (`helpers.ts`: `buildTestApp`, `gql`; specs use top-level `await buildTestApp()`) and hits Express via supertest / yoga `fetch`. `tests/integration` doesn't exist yet. e2e project inlines `graphql` deps in `vitest.config.ts` so `instanceof GraphQLError` works.

## Conventions / gotchas

- Path aliases `#modules/<auth|users|notes|shared>/*` (tsconfig `paths`, package.json `imports` → `dist`, vitest alias). Relative imports within a module use `.js` extensions.
- `tests/tsconfig.json` is the TS project for tests (`moduleResolution: Bundler`, includes `src/`). Root `tsconfig.json` only covers `src/`; under NodeNext its `paths` fall back to `dist/`, so don't typecheck tests with it.
- Alias imports (`#modules/...`) must NOT end in `.js` (lint-enforced): `package.json` `imports` appends it, so `x.js` works in dev but becomes `x.js.js` in `dist`.
- Build = `tsc` + `scripts/copy-assets.mjs` (copies migration `.sql` files to `dist/`; they're read from `__dirname` at runtime). Production image: `docker/entrypoint.sh` runs `node dist/migrate.js` if `RUN_MIGRATIONS` is true/1, then starts `dist/main.js` with `RUN_MIGRATIONS=false`.
- Source comments are largely in Spanish.
- `data/notes.db*` (SQLite files) is tracked in git.
- CI (`.github/workflows/ci.yml`) currently runs only lint + typecheck; test jobs are commented out. Coverage thresholds in `vitest.config.ts`: 80% lines/functions/statements, 70% branches.
