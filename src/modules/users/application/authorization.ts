import { ForbiddenError } from '#modules/shared/domain/error';

import { Role } from '../domain/role.vo.js';

import type { Actor } from '#modules/shared/domain/actor';

const isAdmin = (actor: Actor): boolean => actor.role === Role.admin().value;

export function assertIsAdmin(actor: Actor): void {
  if (!isAdmin(actor)) throw new ForbiddenError('Admin role required');
}

/** Un usuario solo puede ver su propio perfil; admin puede ver cualquiera. */
export function assertCanViewUser(userId: string, actor: Actor): void {
  if (actor.id === userId || isAdmin(actor)) return;
  throw new ForbiddenError('Not allowed to access this user');
}
