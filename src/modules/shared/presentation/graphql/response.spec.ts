import { describe, expect, it } from 'vitest';

import { errorExtensions, gqlResponse, responseTypeDef } from './response.js';

describe('graphql response helpers', () => {
  it('gqlResponse builds the success envelope', () => {
    const r = gqlResponse({ data: { id: 1 }, message: 'ok' });
    expect(r).toMatchObject({ success: true, statusCode: 200, message: 'ok', data: { id: 1 } });
    expect(new Date(r.timestamp).toISOString()).toBe(r.timestamp);
    expect(gqlResponse({ data: null, message: 'c', statusCode: 201 }).statusCode).toBe(201);
  });

  it('errorExtensions derives statusCode from the code', () => {
    expect(errorExtensions('NOT_FOUND')).toMatchObject({
      code: 'NOT_FOUND',
      success: false,
      statusCode: 404,
    });
    expect(errorExtensions('NOT_FOUND')).not.toHaveProperty('details');
    expect(errorExtensions('VALIDATION_ERROR', ['x']).details).toEqual(['x']);
    expect(errorExtensions('WHATEVER').statusCode).toBe(500);
  });

  it('responseTypeDef declares the standard fields with the given data type', () => {
    const sdl = responseTypeDef('NoteResponse', 'Note');
    expect(sdl).toContain('type NoteResponse');
    expect(sdl).toContain('data: Note');
    for (const f of [
      'success: Boolean!',
      'statusCode: Int!',
      'message: String!',
      'timestamp: String!',
    ]) {
      expect(sdl).toContain(f);
    }
  });
});
