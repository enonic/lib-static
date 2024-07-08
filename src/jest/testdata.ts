import type { Log } from './global.d';
import type { Response } from '../main/resources/lib/enonic/static/types';

import {
  expect,
  jest
} from '@jest/globals';


// Avoid type errors
declare module globalThis {
  var log: Log
}


export const internalServerErrorResponse = {
  body: expect.stringMatching(/^Server error \(logged with error ID: .+\)$/),
  contentType: "text/plain; charset=utf-8",
  status: 500
} as unknown as Response;


export const notFoundResponse = {
  body: expect.stringMatching(/^Not found: .+$/),
  contentType: "text/plain; charset=utf-8",
  status: 404
} as unknown as Response;

export function badRequestResponse(overrides: Partial<Response> = {}) {
  return {
    body: expect.stringMatching(/^Bad request: .+$/),
    contentType: 'text/plain; charset=utf-8',
    ...overrides,
    status: 400,
  } as unknown as Response;
}

export function okResponse(overrides: Partial<Response> = {}) {
  return {
    contentType: 'text/html',
    ...overrides,
    status: 200,
  } as unknown as Response;
}

export function silenceLogError(fn) {
  const temp = globalThis.log.error;
    globalThis.log.error = jest.fn();
    const res = fn();
    globalThis.log.error = temp;
    return res;
}
