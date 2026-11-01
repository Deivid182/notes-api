import { Router } from 'express';

import { AuthMiddleware } from '#modules/auth/presentation/http/v1/middlewares/auth.middleware';
import { type Container } from '#modules/shared/infrastructure/config/container';
import { validateRequest } from '#modules/shared/presentation/http/v1/middlewares/validate-request.middleware';

import { NotesController } from './notes.controller.js';
import { createNoteSchema, updateNoteSchema } from './schemas/notes.schemas.js';

export function createNotesRouter(container: Container): Router {
  const router = Router();
  const controller = new NotesController(container);

  router.use(AuthMiddleware(container.tokenService));

  router.post('/', validateRequest(createNoteSchema), controller.create);
  router.get('/', controller.list);
  router.get('/:id', controller.get);
  router.patch('/:id', validateRequest(updateNoteSchema), controller.update);
  router.delete('/:id', controller.delete);

  return router;
}
