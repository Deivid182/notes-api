import { describe, expect, it } from 'vitest';

import { schema } from './schema.js';

describe('GraphQL schema', () => {
  it('should expose the user root fields', () => {
    const queryFields = schema.getQueryType()?.getFields();
    const mutationFields = schema.getMutationType()?.getFields();

    expect(queryFields).toBeDefined();
    expect(mutationFields).toBeDefined();
    expect(queryFields?.getUser).toBeDefined();
    expect(mutationFields?.createUser).toBeDefined();
  });
});
