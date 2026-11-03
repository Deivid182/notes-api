import { describe, expect, it } from 'vitest';

import { statusOf } from './status.js';

describe('statusOf', () => {
  it.each([
    ['VALIDATION_ERROR', 400],
    ['UNAUTHORIZED', 401],
    ['FORBIDDEN', 403],
    ['NOT_FOUND', 404],
    ['CONFLICT', 409],
    ['INTERNAL_ERROR', 500],
    ['SOMETHING_ELSE', 500],
  ])('%s → %i', (code, status) => {
    expect(statusOf(code)).toBe(status);
  });
});
