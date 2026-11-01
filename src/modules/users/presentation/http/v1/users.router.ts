import { Router } from 'express';

import { AuthMiddleware } from '#modules/auth/presentation/http/v1/middlewares/auth.middleware';
import { requireRole } from '#modules/auth/presentation/http/v1/middlewares/require-role.middleware';
import { validateRequest } from '#modules/shared/presentation/http/v1/middlewares/validate-request.middleware';

import { assignRoleSchema, createUserSchema } from './schemas/users.schemas.js';
import { UsersController } from './users.controller.js';

import type { Container } from '#modules/shared/infrastructure/config/container';

export function createUsersRouter(container: Container) {
  const router = Router();
  const usersController = new UsersController(container);

  // Registro público: /auth/register. Aquí todo requiere sesión.
  router.use(AuthMiddleware(container.tokenService));

  // Crear usuarios con rol arbitrario es solo para admin.
  router.post('/', requireRole('admin'), validateRequest(createUserSchema), (req, res, next) =>
    usersController.createUser(req, res, next),
  );
  // Propio perfil o admin (lo decide GetUserUseCase).
  router.get('/:id', (req, res, next) => usersController.getUser(req, res, next));
  // Solo admin (lo decide AssignRoleUseCase).
  router.post('/:id/assign-role', validateRequest(assignRoleSchema), (req, res, next) =>
    usersController.assignRole(req, res, next),
  );

  return router;
}
