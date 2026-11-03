import { actorOf } from '#modules/shared/presentation/http/v1/actor';

import { mapUser } from '../../mappers/user.mapper.js';

import type { UsersModule } from '#modules/users/users.module';
import type { AssignRoleBody, CreateUserBody } from './schemas/users.schemas.js';
import type { Request, Response } from 'express';

export class UsersController {
  constructor(private useCases: UsersModule['useCases']) {}

  createUser = async (req: Request, res: Response) => {
    const { email, password, role } = req.body as CreateUserBody;
    const user = await this.useCases.createUser.execute({ email, password, role });
    res.status(201).json({ data: mapUser(user) });
  };

  getUser = async (req: Request, res: Response) => {
    const user = await this.useCases.getUser.execute({
      actor: actorOf(req),
      userId: req.params.id as string,
    });
    res.status(200).json({ data: mapUser(user) });
  };

  assignRole = async (req: Request, res: Response) => {
    const { role } = req.body as AssignRoleBody;
    const user = await this.useCases.assignRole.execute({
      actor: actorOf(req),
      userId: req.params.id as string,
      role,
    });
    res.status(200).json({ data: mapUser(user) });
  };
}
