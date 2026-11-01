import { Router } from 'express';

import { type TokenService } from '#modules/auth/domain/interfaces/token-service.interface';
import { AuthMiddleware } from '#modules/auth/presentation/http/v1/middlewares/auth.middleware';
import { type NotesModule } from '#modules/notes/notes.module';
import { validateRequest } from '#modules/shared/presentation/http/v1/middlewares/validate-request.middleware';

import { NotesController } from './notes.controller.js';
import {
  createNoteSchema,
  listNotesQuerySchema,
  updateNoteSchema,
} from './schemas/notes.schemas.js';

export interface NotesRouterDeps {
  useCases: NotesModule['useCases'];
  tokenService: TokenService;
}

export function createNotesRouter({ useCases, tokenService }: NotesRouterDeps): Router {
  const router = Router();
  const controller = new NotesController(useCases);

  router.use(AuthMiddleware(tokenService));

  router.post('/', validateRequest(createNoteSchema), controller.create);
  router.get('/', validateRequest(listNotesQuerySchema, 'query'), controller.list);
  router.get('/:id', controller.get);
  router.patch('/:id', validateRequest(updateNoteSchema), controller.update);
  router.delete('/:id', controller.delete);

  return router;
}
