import { describe, expect, it } from 'vitest';

import { ValidationError } from './error.js';
import { normalizePage, toPage } from './pagination.js';

describe('normalizePage', () => {
  it('applies defaults', () => {
    expect(normalizePage()).toEqual({ limit: 50, offset: 0 });
    expect(normalizePage({})).toEqual({ limit: 50, offset: 0 });
  });

  it('accepts the boundaries', () => {
    expect(normalizePage({ limit: 1, offset: 0 })).toEqual({ limit: 1, offset: 0 });
    expect(normalizePage({ limit: 100, offset: 500 })).toEqual({ limit: 100, offset: 500 });
  });

  it.each([
    { limit: 0 },
    { limit: 101 },
    { limit: 1.5 },
    { limit: NaN },
    { offset: -1 },
    { offset: 0.5 },
  ])('rejects %j', (input) => {
    expect(() => normalizePage(input)).toThrow(ValidationError);
  });
});

describe('toPage', () => {
  it('uses the extra row only to flag hasMore', () => {
    const page = toPage([1, 2, 3], { limit: 2, offset: 0 });
    expect(page).toEqual({ items: [1, 2], limit: 2, offset: 0, hasMore: true });
    expect(toPage([1, 2], { limit: 2, offset: 4 }).hasMore).toBe(false);
  });
});
