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
    const { id } = req.params;

    try {
      const user = await getUser.execute(id as string);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(200).json({ data: toUserDTO(user) });
    } catch (e) {
      next(e);
    }
  }

  async assignRole(req: Request, res: Response, next: NextFunction) {
    const { assignRole } = this.container.modules.users.useCases;
    const { id } = req.params;
    const { role } = req.body;

    try {
      const user = await assignRole.execute({ userId: id as string, role });
      res.status(200).json({ data: toUserDTO(user) });
    } catch (e) {
      next(e);
    }
  }
}
