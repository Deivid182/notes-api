import { actorOf } from '#modules/shared/presentation/http/v1/actor';
import { sendData } from '#modules/shared/presentation/http/v1/response';

import { mapUser } from '../../mappers/user.mapper.js';

import type { UsersModule } from '#modules/users/users.module';
import type { AssignRoleBody, CreateUserBody } from './schemas/users.schemas.js';
import type { Request, Response } from 'express';

export class UsersController {
  constructor(private useCases: UsersModule['useCases']) {}

  createUser = async (req: Request, res: Response) => {
    const { email, password, role } = req.body as CreateUserBody;
    const user = await this.useCases.createUser.execute({ email, password, role });
    sendData(res, mapUser(user), 201);
  };

  getUser = async (req: Request, res: Response) => {
    const user = await this.useCases.getUser.execute({
      actor: actorOf(req),
      userId: req.params.id as string,
    });
    sendData(res, mapUser(user));
  };

  assignRole = async (req: Request, res: Response) => {
    const { role } = req.body as AssignRoleBody;
    const user = await this.useCases.assignRole.execute({
      actor: actorOf(req),
      userId: req.params.id as string,
      role,
    });
    sendData(res, mapUser(user));
  };
}
