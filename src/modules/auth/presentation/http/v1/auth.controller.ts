import { UnauthorizedError } from '#modules/shared/domain/error';
import { sendData } from '#modules/shared/presentation/http/v1/response';

import { mapAuthPayload } from '../../mappers/auth.mapper.js';

import type { AuthModule } from '#modules/auth/auth.module';
import type { LoginBody, LogoutBody, RefreshBody, RegisterBody } from './auth.schemas.js';
import type { Request, Response } from 'express';

const REFRESH_COOKIE = 'refresh_token';

export class AuthController {
  constructor(
    private useCases: AuthModule['useCases'],
    private secureCookies: boolean,
  ) {}

  register = async (req: Request, res: Response) => {
    const { email, password } = req.body as RegisterBody;
    const result = await this.useCases.registerUser.execute({ email, password });
    this.setRefreshCookie(res, result.refreshToken);
    sendData(res, {
      data: mapAuthPayload(result.user, result.accessToken, result.refreshToken),
      message: 'User registered',
      status: 201,
    });
  };

  login = async (req: Request, res: Response) => {
    const { email, password } = req.body as LoginBody;
    const result = await this.useCases.login.execute({ email, password });
    this.setRefreshCookie(res, result.refreshToken);
    sendData(res, {
      data: mapAuthPayload(result.user, result.accessToken, result.refreshToken),
      message: 'Login successful',
    });
  };

  refresh = async (req: Request, res: Response) => {
    const fromCookie = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    const refreshToken = (req.body as RefreshBody).refreshToken ?? fromCookie;
    if (!refreshToken) throw new UnauthorizedError('Missing refresh token');

    const result = await this.useCases.refreshToken.execute({ refreshToken });
    this.setRefreshCookie(res, result.refreshToken);
    sendData(res, {
      data: mapAuthPayload(result.user, result.accessToken, result.refreshToken),
      message: 'Token refreshed',
    });
  };

  logout = async (req: Request, res: Response) => {
    const fromCookie = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    const body = req.body as LogoutBody;
    await this.useCases.logout.execute({
      refreshToken: body.refreshToken ?? fromCookie,
      userId: req.user?.id,
      all: body.all,
    });
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    sendData(res, { data: null, message: 'Logged out' });
  };

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: this.secureCookies,
      path: '/',
    });
  }
}
