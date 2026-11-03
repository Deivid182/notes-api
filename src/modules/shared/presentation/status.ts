/** `DomainError.code` → status HTTP. Lo comparten HTTP (respuesta) y GraphQL (`extensions.statusCode`). */
const STATUS_BY_CODE: Record<string, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
};

export function statusOf(code: string): number {
  return STATUS_BY_CODE[code] ?? 500;
}
