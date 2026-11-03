import { describe, expect, it } from 'vitest';

import { ValidationError } from '../error.js';

import { Email } from './email.vo.js';

describe('Email', () => {
  it('trims and lowercases', () => {
    expect(Email.create('  Foo@Bar.COM ').value).toBe('foo@bar.com');
  });

  it.each(['', 'nope', 'a@b', '@x.com', 'a b@x.com'])('rejects %j', (raw) => {
    expect(() => Email.create(raw)).toThrow(ValidationError);
  });

  it('restore keeps the stored value untouched', () => {
    expect(Email.restore('Stored As-Is').value).toBe('Stored As-Is');
  });
});
