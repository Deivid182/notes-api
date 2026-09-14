import { type AuthModule, createAuthModule } from '#modules/auth/auth.module';
import { createUsersModule, type UsersModule } from '#modules/users/users.module.js';

import type { Clock } from '#modules/shared/domain/interfaces/clock.interface';
import type { Logger } from '#modules/shared/domain/interfaces/logger.interface';
import type { Env } from './env.js';
import type { Persistence, SharedContext } from './shared-context.js';

/**
 * Fachada del composition root. Mantiene la forma "plana" que usan controllers
 * y resolvers (`container.useCases.X`, `container.tokenService`), pero delega
 * la construcción real a cada `<module>.module.ts`.
 */
export interface Container {
  env: Env;
  logger: Logger;
  clock: Clock;
  persistence: Persistence;
  tokenService: AuthModule['tokenService'];
  modules: {
    users: UsersModule;
    auth: AuthModule;
    // notes: NotesModule;
  };
  useCases: UsersModule['useCases'] & AuthModule['useCases'] /* & NotesModule['useCases'] */;
}

export interface BuildContainerOptions {
  shared: SharedContext;
}

export function buildContainer({ shared }: BuildContainerOptions): Container {
  // Orden de construcción explícito según el grafo de dependencias:
  //   users → auth
  //   notes (independiente)
  const users = createUsersModule(shared);
  const auth = createAuthModule({ shared, users });
  // const notes = createNotesModule(shared);

  return {
    env: shared.env,
    logger: shared.logger,
    clock: shared.clock,
    persistence: shared.persistence,
    tokenService: auth.tokenService,
    modules: { users, auth /*  notes */ },
    useCases: {
      ...users.useCases,
      ...auth.useCases,
      // ...notes.useCases,
    },
  };
}

// Re-exports para el composition root de `main.ts`.
export { buildSharedContext } from './shared-context.js';
export type { SharedContext, Persistence } from './shared-context.js';
