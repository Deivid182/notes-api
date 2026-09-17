import { Router } from 'express';

import { validateRequest } from '../../../../shared/presentation/http/v1/middlewares/validate-request.middleware.js';

import { assignRoleSchema, createUserSchema } from './schemas/users.schemas.js';
import { UsersController } from './users.controller.js';

import type { Container } from '#modules/shared/infrastructure/config/container';

export function createUsersRouter(container: Container) {
  const router = Router();
  const usersController = new UsersController(container);

  router.post('/', validateRequest(createUserSchema), (req, res, next) =>
    usersController.createUser(req, res, next),
  );
  router.get('/:id', (req, res, next) => usersController.getUser(req, res, next));
  router.post('/:id/assign-role', validateRequest(assignRoleSchema), (req, res, next) =>
    usersController.assignRole(req, res, next),
  );

  return router;
}
