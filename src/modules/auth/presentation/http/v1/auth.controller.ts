import { type Container } from '#modules/shared/infrastructure/config/container';

import { toAuthPayload } from './auth.dto.js';

import type { Request, Response, NextFunction } from 'express';

const REFRESH_COOKIE = 'refresh_token';

export class AuthController {
  constructor(private container: Container) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as { email: string; password: string };
      const result = await this.container.useCases.registerUser.execute({ email, password });
      this.setRefreshCookie(res, result.refreshToken);
      res
        .status(201)
        .json({ data: toAuthPayload(result.user, result.accessToken, result.refreshToken) });
    } catch (e) {
      next(e);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as { email: string; password: string };
      const result = await this.container.useCases.login.execute({ email, password });
      this.setRefreshCookie(res, result.refreshToken);
      res.json({ data: toAuthPayload(result.user, result.accessToken, result.refreshToken) });
    } catch (e) {
      next(e);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fromCookie = req.cookies?.[REFRESH_COOKIE] as string | undefined;
      const fromBody = (req.body as { refreshToken?: string }).refreshToken;
      const refreshToken = fromBody ?? fromCookie;
      if (!refreshToken) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing refresh token' } });
        return;
      }
      const result = await this.container.useCases.refreshToken.execute({ refreshToken });
      this.setRefreshCookie(res, result.refreshToken);
      res.json({ data: toAuthPayload(result.user, result.accessToken, result.refreshToken) });
    } catch (e) {
      next(e);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fromCookie = req.cookies?.[REFRESH_COOKIE] as string | undefined;
      const body = req.body as { refreshToken?: string; all?: boolean };
      await this.container.useCases.logout.execute({
        refreshToken: body.refreshToken ?? fromCookie,
        userId: req.user?.id,
        all: body.all,
      });
      res.clearCookie(REFRESH_COOKIE, { path: '/' });
      res.json({ data: { success: true } });
    } catch (e) {
      next(e);
    }
  };

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: this.container.env.NODE_ENV === 'production',
      path: '/',
    });
  }
}
