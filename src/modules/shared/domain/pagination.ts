import { ValidationError } from './error.js';

export const DEFAULT_PAGE_LIMIT = 50;
export const MAX_PAGE_LIMIT = 100;

export interface PageRequest {
  limit: number;
  offset: number;
}

export interface Page<T> {
  items: T[];
  limit: number;
  offset: number;
  /** Hay más resultados después de esta página. */
  hasMore: boolean;
}

/** Aplica los valores por defecto y valida los límites. Única fuente de la regla. */
export function normalizePage(input: { limit?: number; offset?: number } = {}): PageRequest {
  const limit = input.limit ?? DEFAULT_PAGE_LIMIT;
  const offset = input.offset ?? 0;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_LIMIT) {
    throw new ValidationError(`limit must be an integer between 1 and ${MAX_PAGE_LIMIT}`);
  }
  if (!Number.isInteger(offset) || offset < 0) {
    throw new ValidationError('offset must be a non-negative integer');
  }
  return { limit, offset };
}

/** Recibe hasta `limit + 1` filas: la fila extra solo indica que hay más. */
export function toPage<T>(rows: T[], request: PageRequest): Page<T> {
  return {
    items: rows.slice(0, request.limit),
    limit: request.limit,
    offset: request.offset,
    hasMore: rows.length > request.limit,
  };
}
