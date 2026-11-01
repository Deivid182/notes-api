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

  it('should expose me and the notes root fields', () => {
    const queryFields = schema.getQueryType()?.getFields();
    const mutationFields = schema.getMutationType()?.getFields();

    expect(queryFields?.me).toBeDefined();
    expect(queryFields?.notes).toBeDefined();
    expect(queryFields?.note).toBeDefined();
    expect(mutationFields?.createNote).toBeDefined();
    expect(mutationFields?.updateNote).toBeDefined();
    expect(mutationFields?.deleteNote).toBeDefined();
  });
});
