import { Router } from 'express';

import { AuthMiddleware } from '#modules/auth/presentation/http/v1/middlewares/auth.middleware';
import { requireRole } from '#modules/auth/presentation/http/v1/middlewares/require-role.middleware';
import { validateRequest } from '#modules/shared/presentation/http/v1/middlewares/validate-request.middleware';

import { assignRoleSchema, createUserSchema } from './schemas/users.schemas.js';
import { UsersController } from './users.controller.js';

import type { TokenService } from '#modules/auth/domain/interfaces/token-service.interface';
import type { UsersModule } from '#modules/users/users.module';

export interface UsersRouterDeps {
  useCases: UsersModule['useCases'];
  tokenService: TokenService;
}

export function createUsersRouter({ useCases, tokenService }: UsersRouterDeps) {
  const router = Router();
  const usersController = new UsersController(useCases);

  // Registro público: /auth/register. Aquí todo requiere sesión.
  router.use(AuthMiddleware(tokenService));

  // Crear usuarios con rol arbitrario es solo para admin.
  router.post(
    '/',
    requireRole('admin'),
    validateRequest(createUserSchema),
    usersController.createUser,
  );
  // Propio perfil o admin (lo decide GetUserUseCase).
  router.get('/:id', usersController.getUser);
  // Solo admin (lo decide AssignRoleUseCase).
  router.post('/:id/assign-role', validateRequest(assignRoleSchema), usersController.assignRole);

  return router;
}
