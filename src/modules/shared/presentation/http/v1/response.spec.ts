import { describe, expect, it, vi } from 'vitest';

import { sendData, sendError, sendList } from './response.js';

import type { Response } from 'express';

function fakeRes(originalUrl = '/api/v1/things?x=1') {
  const res = {
    req: { originalUrl },
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response & typeof res;
}

const iso = expect.stringMatching(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/);

describe('http response helpers', () => {
  it('sendData builds the success envelope (200 by default)', () => {
    const res = fakeRes();
    sendData(res, { data: { id: 1 }, message: 'Done' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      statusCode: 200,
      message: 'Done',
      path: '/api/v1/things?x=1',
      timestamp: iso,
      data: { id: 1 },
    });
  });

  it('sendData honours a custom status and null data', () => {
    const res = fakeRes();
    sendData(res, { data: null, message: 'Created', status: 201 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json.mock.calls[0]?.[0]).toMatchObject({ statusCode: 201, data: null });
  });

  it('sendList adds meta', () => {
    const res = fakeRes();
    sendList(res, { data: [1, 2], meta: { limit: 2 }, message: 'Listed' });
    expect(res.json.mock.calls[0]?.[0]).toMatchObject({
      success: true,
      data: [1, 2],
      meta: { limit: 2 },
    });
  });

  it('sendError builds the error envelope without data', () => {
    const res = fakeRes();
    sendError(res, { status: 404, code: 'NOT_FOUND', message: 'nope' });
    expect(res.status).toHaveBeenCalledWith(404);
    const body = res.json.mock.calls[0]?.[0];
    expect(body).toEqual({
      success: false,
      statusCode: 404,
      message: 'nope',
      path: '/api/v1/things?x=1',
      timestamp: iso,
      error: { code: 'NOT_FOUND' },
    });
    expect(body).not.toHaveProperty('data');
  });

  it('sendError includes details only when given', () => {
    const res = fakeRes();
    sendError(res, { status: 400, code: 'VALIDATION_ERROR', message: 'bad', details: [{ a: 1 }] });
    expect(res.json.mock.calls[0]?.[0].error).toEqual({
      code: 'VALIDATION_ERROR',
      details: [{ a: 1 }],
    });
  });
});
