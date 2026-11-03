import { type AuthModule, createAuthModule } from '#modules/auth/auth.module';
import { createNotesModule, type NotesModule } from '#modules/notes/notes.module';
import { createUsersModule, type UsersModule } from '#modules/users/users.module';

import type { Clock } from '#modules/shared/domain/interfaces/clock.interface';
import type { Logger } from '#modules/shared/domain/interfaces/logger.interface';
import type { Env } from '#modules/shared/infrastructure/config/env';
import type { Persistence } from '#modules/shared/infrastructure/persistence/persistence';
import type { SharedContext } from '#modules/shared/infrastructure/shared-context';

/**
 * Resultado del composition root. Los casos de uso y servicios de cada módulo se
 * alcanzan siempre por `container.modules.<módulo>`; nada se aplana ni se duplica.
 */
export interface Container {
  env: Env;
  logger: Logger;
  clock: Clock;
  persistence: Persistence;
  modules: {
    users: UsersModule;
    auth: AuthModule;
    notes: NotesModule;
  };
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
  const notes = createNotesModule(shared);

  return {
    env: shared.env,
    logger: shared.logger,
    clock: shared.clock,
    persistence: shared.persistence,
    modules: { users, auth, notes },
  };
}
