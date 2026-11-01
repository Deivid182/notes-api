import { actorOf } from '#modules/shared/presentation/http/v1/actor';

import { toUserDTO } from './dtos/users.dto.js';

import type { UsersModule } from '#modules/users/users.module';
import type { NextFunction, Request, Response } from 'express';

export class UsersController {
  constructor(private useCases: UsersModule['useCases']) {}

  async createUser(req: Request, res: Response, next: NextFunction) {
    const { createUser } = this.useCases;
    const { role, email, password } = req.body;

    try {
      const user = await createUser.execute({ email, password, role });
      res.status(201).json({ data: toUserDTO(user) });
    } catch (e) {
      next(e);
    }
  }

  async getUser(req: Request, res: Response, next: NextFunction) {
    const { getUser } = this.useCases;

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
    const { assignRole } = this.useCases;
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
