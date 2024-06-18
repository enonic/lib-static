import type {Request} from '../main/resources/lib/enonic/static/types';

import {
  describe,
  expect,
  test as it
} from '@jest/globals';
import {buildGetter} from '../main/resources/lib/enonic/static';
// import libStatic from '../main/resources/lib/enonic/static';
import {INDEX_HTML} from './setupFile';


describe('buildGetter', () => {
  it('throws when there are no params', () => {
    // @ts-expect-error missing param
    expect(() => buildGetter()).toThrow();
  });

  it('no options', () => {
    // In starter-tsup 'static' is used. No start or end slash.
    const getter = buildGetter('myroot');
    expect(getter).toBeInstanceOf(Function);

    // @ts-expect-error missing param
    expect(getter()).toEqual({
      body: expect.stringMatching(/^Server error \(logged with error ID: .+\)$/),
      contentType: "text/plain; charset=utf-8",
      status: 500
    });

    const request: Request<{
      contextPath: string
      rawPath: string
    }> = {
      branch: 'master',
      contextPath: '/',
      host: 'localhost',
      method: 'GET',
      mode: 'live',
      path: '/',
      port: 8080,
      rawPath: '/',
      scheme: 'http',
      url: 'http://localhost:8080/'
    };
    expect(getter(request)).toEqual({
      body: INDEX_HTML,
      contentType: 'text/html',
      headers: {
        'cache-control': 'no-cache'
      },
      status: 200
    });
  });
});
