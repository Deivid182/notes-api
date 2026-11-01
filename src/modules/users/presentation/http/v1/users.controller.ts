import { actorOf } from '#modules/shared/presentation/http/v1/actor';

import { toUserDTO } from './dtos/users.dto.js';

import type { Container } from '#modules/shared/infrastructure/config/container';
import type { NextFunction, Request, Response } from 'express';

export class UsersController {
  constructor(private container: Container) {}

  async createUser(req: Request, res: Response, next: NextFunction) {
    const { createUser } = this.container.modules.users.useCases;
    const { role, email, password } = req.body;

    try {
      const user = await createUser.execute({ email, password, role });
      res.status(201).json({ data: toUserDTO(user) });
    } catch (e) {
      next(e);
    }
  }

  async getUser(req: Request, res: Response, next: NextFunction) {
    const { getUser } = this.container.modules.users.useCases;

    try {
      const user = await getUser.execute({
        actor: actorOf(req),
        userId: req.params.id as string,
      });
      res.status(200).json({ data: toUserDTO(user) });
    } catch (e) {
      next(e);
    }
  }

  async assignRole(req: Request, res: Response, next: NextFunction) {
    const { assignRole } = this.container.modules.users.useCases;
    const { role } = req.body;

    try {
      const user = await assignRole.execute({
        actor: actorOf(req),
        userId: req.params.id as string,
        role,
      });
      res.status(200).json({ data: toUserDTO(user) });
    } catch (e) {
      next(e);
    }
  }
}
