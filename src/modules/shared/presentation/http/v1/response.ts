import type { Response } from 'express';

/** Contrato único de respuestas HTTP: `{ data }`, `{ data, meta }`, `{ error }` o 204 sin cuerpo. */
export interface ApiData<T> {
  data: T;
}
export interface ApiList<T, M> {
  data: T[];
  meta: M;
}
export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export function sendData<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ data } satisfies ApiData<T>);
}

export function sendList<T, M>(res: Response, data: T[], meta: M): void {
  res.status(200).json({ data, meta } satisfies ApiList<T, M>);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}

export interface ErrorResponse {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

export function sendError(res: Response, { status, code, message, details }: ErrorResponse): void {
  const error: ApiErrorBody['error'] = { code, message };
  if (details !== undefined) error.details = details;
  res.status(status).json({ error } satisfies ApiErrorBody);
}
