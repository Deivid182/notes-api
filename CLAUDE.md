# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

pnpm, Node >=24 (uses `node:sqlite`), ESM TypeScript (`NodeNext`).

- `pnpm dev` — `tsx watch src/main.ts`
- `pnpm build` / `pnpm start` — tsc to `dist/`, run `dist/main.js`
- `pnpm lint` / `pnpm lint:fix`, `pnpm typecheck`, `pnpm format`
- `pnpm test:unit` (`src/**/*.spec.ts`), `pnpm test:integration` (`tests/integration`, empty), `pnpm test:e2e` (`tests/e2e`)
- Single test: `pnpm vitest run --project unit path/to/file.spec.ts` (add `-t "name"` to filter)
- `make docker-up` / `docker-down` — compose stack
- Husky: pre-commit = lint-staged; pre-push = typecheck + lint + unit tests; commit-msg = commitlint (conventional commits).
- JWT `*_EXPIRES_IN` bare numbers = seconds (adapter converts; jsonwebtoken would read ms).
- Env: copy `.env.example` to `.env`. Validated by zod in `src/modules/shared/infrastructure/config/env.ts`.

## Architecture

Modular monolith, hexagonal/DDD-style. Modules under `src/modules/`: `users`, `auth`, `notes`, `shared`. Each module layers `domain/` (entities, VOs, repository interfaces) → `application/` (use cases) → `infrastructure/` (repository impls per DB engine, adapters) → `presentation/` (`http/v1` Express 5 + zod schemas/DTOs, `graphql` typedefs + resolvers).

- **Composition root**: each module has `<name>.module.ts` exporting `createXModule(deps)` that wires use cases and picks the repository impl by `env.DATABASE_ENGINE` (sqlite | postgres | mongodb). `shared/infrastructure/config/container.ts` `buildContainer` builds modules in dependency order (users → auth; notes independent) and exposes a flat `container.useCases.*` / `container.tokenService` used by controllers and resolvers. New module: add to `Container` interface, build order, and merge `useCases`.
- **Bootstrap** (`src/main.ts`): connect persistence → run migrations if `RUN_MIGRATIONS` → `buildSharedContext` → `buildContainer` → start HTTP (`PORT_HTTP`) and/or GraphQL Yoga (`PORT_GRAPHQL`) per `PRESENTATION_PROTOCOL` (`http|graphql|both`) → graceful shutdown. All three engines are wired in `bootstrapPersistence`: sqlite (sync `connectSqlite`), postgres (`pg` Pool via `persistence/postgres/connection.ts`), mongodb (`connectMongo(DATABASE_URL, DATABASE_NAME)` returns `{client, db}`). `RUN_MIGRATIONS=true` runs the engine's migrations: SQL files in `persistence/{sqlite,postgres}/migrations/` or index creation in `persistence/mongodb/migrate.ts`.
- **Shared kernel** (`modules/shared`): ports (`Clock`, `Logger`, `PasswordHasher`, `UseCase`), `Email` VO, domain errors (`domain/error.ts`) mapped to HTTP by `error.middleware.ts`, SQLite connection + SQL migrations (`persistence/sqlite/migrations/*.sql`).
- **Auth**: JWT access + refresh tokens; `TokenIssuerService` issues and persists refresh tokens; `RegisterUserUseCase` reuses users' `CreateUserUseCase`. Auth middleware in `auth/presentation/http/v1/middlewares`.
- **Notes**: use cases take an `Actor` (`application/actor.ts`) and check `authorization.ts` (owner or admin). `listNotes` returns all notes for admins, own notes otherwise. HTTP `/api/v1/notes` (all routes need bearer token) and GraphQL `notes`/`note`/`createNote`/`updateNote`/`deleteNote`; GraphQL auth via `requireUser(ctx)`.
- **Tests**: unit specs sit next to source (`*.spec.ts`); e2e (`tests/e2e`) builds the real container on in-memory SQLite (`helpers.ts`: `buildTestApp`, `gql`) and hits Express via supertest / yoga `fetch`. `tests/integration` doesn't exist yet. e2e project inlines `graphql` deps in `vitest.config.ts` so `instanceof GraphQLError` works.

## Conventions / gotchas

- Path aliases `#modules/<auth|users|notes|shared>/*` (tsconfig `paths`, package.json `imports` → `dist`, vitest alias). Relative imports within a module use `.js` extensions.
- `tests/tsconfig.json` is the TS project for tests (`moduleResolution: Bundler`, includes `src/`). Root `tsconfig.json` only covers `src/`; under NodeNext its `paths` fall back to `dist/`, so don't typecheck tests with it.
- Migration `.sql` files are read from `__dirname` at runtime; `tsc` does not copy them to `dist/`, so `pnpm start` with `RUN_MIGRATIONS=true` will not find them.
- Source comments are largely in Spanish.
- `data/notes.db*` (SQLite files) is tracked in git.
- CI (`.github/workflows/ci.yml`) currently runs only lint + typecheck; test jobs are commented out. Coverage thresholds in `vitest.config.ts`: 80% lines/functions/statements, 70% branches.
