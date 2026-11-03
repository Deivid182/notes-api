import type { Response } from 'express';

/**
 * Contrato único de respuestas HTTP.
 * Éxito: `{ success, statusCode, message, data, meta?, path, timestamp }`.
 * Error: `{ success, statusCode, message, error: { code, details? }, path, timestamp }` (sin `data`).
 */
interface Envelope {
  success: boolean;
  statusCode: number;
  message: string;
  path: string;
  timestamp: string;
}
export interface SuccessBody<T, M = undefined> extends Envelope {
  success: true;
  data: T;
  meta?: M;
}
export interface ErrorBody extends Envelope {
  success: false;
  error: { code: string; details?: unknown };
}

export interface DataResponse<T> {
  data: T;
  message: string;
  status?: number;
}
export interface ListResponse<T, M> {
  data: T[];
  meta: M;
  message: string;
}
export interface ErrorResponse {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

const envelope = (res: Response, statusCode: number, message: string) => ({
  statusCode,
  message,
  path: res.req.originalUrl,
  timestamp: new Date().toISOString(),
});

export function sendData<T>(res: Response, { data, message, status = 200 }: DataResponse<T>): void {
  const body: SuccessBody<T> = { success: true, ...envelope(res, status, message), data };
  res.status(status).json(body);
}

export function sendList<T, M>(res: Response, { data, meta, message }: ListResponse<T, M>): void {
  const body: SuccessBody<T[], M> = { success: true, ...envelope(res, 200, message), data, meta };
  res.status(200).json(body);
}

export function sendError(res: Response, { status, code, message, details }: ErrorResponse): void {
  const error: ErrorBody['error'] = { code };
  if (details !== undefined) error.details = details;
  const body: ErrorBody = { success: false, ...envelope(res, status, message), error };
  res.status(status).json(body);
}
