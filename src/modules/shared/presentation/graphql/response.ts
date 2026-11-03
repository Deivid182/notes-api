import { statusOf } from '../status.js';

/**
 * Contrato único de respuestas GraphQL (mismos campos que HTTP, sin `path`: GraphQL ya lo
 * reporta por error). Éxito: tipos `XResponse` creados con `responseTypeDef` + `gqlResponse`.
 * Error: `extensions` con `{ code, success, statusCode, timestamp, details? }` (sin `data`).
 */
export interface GqlResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

export function gqlResponse<T>({
  data,
  message,
  statusCode = 200,
}: {
  data: T;
  message: string;
  statusCode?: number;
}): GqlResponse<T> {
  return { success: true, statusCode, message, data, timestamp: new Date().toISOString() };
}

export function errorExtensions(code: string, details?: unknown): Record<string, unknown> {
  return {
    code,
    success: false,
    statusCode: statusOf(code),
    timestamp: new Date().toISOString(),
    ...(details !== undefined ? { details } : {}),
  };
}

/** Tipo GraphQL `<name>` con el envoltorio estándar y `data: <dataType>`. */
export function responseTypeDef(name: string, dataType: string): string {
  return /* GraphQL */ `
  type ${name} {
    success: Boolean!
    statusCode: Int!
    message: String!
    data: ${dataType}
    timestamp: String!
  }`;
}
