import { describe, expect, it } from 'vitest';

import { newUuid } from './uuid.js';

describe('newUuid', () => {
  it('returns unique v4 uuids', () => {
    const a = newUuid();
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(newUuid()).not.toBe(a);
  });
});
