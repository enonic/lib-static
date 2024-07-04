import type {Log} from './global.d';
import type {
  Request,
  Response
} from '../main/resources/lib/enonic/static/types';

import {
  describe,
  expect,
  jest,
  test as it
} from '@jest/globals';
import {buildGetter} from '../main/resources/lib/enonic/static';
// import libStatic from '../main/resources/lib/enonic/static';
import {
  INDEX_HTML,
  // STATIC_ASSETS_304_CSS
} from './setupFile';

// Avoid type errors
declare module globalThis {
  var log: Log
}

const errorResponse = {
  body: expect.stringMatching(/^Server error \(logged with error ID: .+\)$/),
  contentType: "text/plain; charset=utf-8",
  status: 500
} as unknown as Response;

const notFoundResponse = {
  body: expect.stringMatching(/^Not found: .+$/),
  contentType: "text/plain; charset=utf-8",
  status: 404
} as unknown as Response;

function silenceLogError(fn) {
  const temp = globalThis.log.error;
    globalThis.log.error = jest.fn();
    const res = fn();
    globalThis.log.error = temp;
    return res;
}


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
    silenceLogError(() => expect(getter()).toEqual(errorResponse));

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
        'cache-control': 'no-cache',
        etag: '1234567890abcdef'
      },
      status: 200
    });
  });

  it('request object without rawpath', () => {
    const request = {} as Request;

    const getterWithoutThrowErrors = buildGetter('myroot');
    silenceLogError(() => expect(getterWithoutThrowErrors(request)).toEqual(errorResponse));

    const getterWithTrowErrors = buildGetter('myroot', {
      throwErrors: true
    });
    expect(() => getterWithTrowErrors(request)).toThrow("Incoming request.rawPath is: undefined. Even when using getCleanPath in such a way that .rawPath isn't used to resolve resource path, request.rawPath must still be a string for index fallback functionality to work.");

    const getterWithTrowErrors2 = buildGetter({
      root: 'myroot',
      throwErrors: true
    });
    expect(() => getterWithTrowErrors2(request)).toThrow("Incoming request.rawPath is: undefined. Even when using getCleanPath in such a way that .rawPath isn't used to resolve resource path, request.rawPath must still be a string for index fallback functionality to work.");
  });

  it('handles path with illegalChars <', () => {
    const scheme = 'http';
    const host = 'localhost';
    const port = 8080;
    const appName = 'com.example.myproject'; // globalThis.app.name
    const root = 'static';
    const contextPath = `/webapp/${appName}`
    const path = `${contextPath}/assets/%3C`;
    const request: Request<{
      contextPath: string
      rawPath: string
    }> = {
      branch: 'master',
      contextPath,
      host,
      method: 'GET',
      mode: 'live',
      path,
      port,
      rawPath: `${contextPath}/assets/<`,
      scheme,
      url: `${scheme}://${host}:${port}${path}`
    };
    const getterWithoutThrowErrors = buildGetter(root);
    expect(getterWithoutThrowErrors(request)).toEqual({
      body: expect.stringMatching(/^Illegal absolute resource path '.+' \(resolved relative path: '.+'\) can't contain '..' or any of these characters: \\ | ? * < > ' \" ` ´$/),
      contentType: "text/plain; charset=utf-8",
      status: 400
    } as unknown as Response)
  });

  it('handles 400', () => {
    const scheme = 'http';
    const host = 'localhost';
    const port = 8080;
    const appName = 'com.example.myproject'; // globalThis.app.name
    const root = 'static';
    const contextPath = `/webapp/${appName}`
    const path = `${contextPath}/assets/400.css`;
    const request: Request<{
      contextPath: string
      rawPath: string
    }> = {
      branch: 'master',
      contextPath,
      host,
      method: 'GET',
      mode: 'live',
      path,
      port,
      rawPath: path,
      scheme,
      url: `${scheme}://${host}:${port}${path}`
    };
    const getterWithoutThrowErrors = buildGetter(root);
    expect(getterWithoutThrowErrors(request)).toEqual(notFoundResponse)
  });

  it('handles 303', () => {
    const scheme = 'http';
    const host = 'localhost';
    const port = 8080;
    const appName = 'com.example.myproject'; // globalThis.app.name
    const root = 'static';
    const contextPath = `/webapp/${appName}`
    const path = `${contextPath}/assets/303.css`;
    const request: Request<{
      contextPath: string
      rawPath: string
    }> = {
      branch: 'master',
      contextPath,
      host,
      method: 'GET',
      mode: 'live',
      path,
      port,
      rawPath: path,
      scheme,
      url: `${scheme}://${host}:${port}${path}`
    };
    const getterWithoutThrowErrors = buildGetter(root);
    expect(getterWithoutThrowErrors(request)).toEqual({
      redirect: '/webapp/com.example.myproject/assets/303.css/'
    } as unknown as Response);
  });

  it('handles 304', () => {
    const scheme = 'http';
    const host = 'localhost';
    const port = 8080;
    const appName = 'com.example.myproject'; // globalThis.app.name
    const root = 'static';
    const contextPath = `/webapp/${appName}`
    const path = `${contextPath}/assets/304.css`;
    const request: Request<{
      contextPath: string
      headers: {
        'if-none-match': string
      }
      rawPath: string
    }> = {
      branch: 'master',
      contextPath,
      headers: {
        'if-none-match': '1234567890abcdef'
      },
      host,
      method: 'GET',
      mode: 'live',
      path,
      port,
      rawPath: path,
      scheme,
      url: `${scheme}://${host}:${port}${path}`
    };
    const getterWithoutThrowErrors = buildGetter(root);
    expect(getterWithoutThrowErrors(request)).toEqual({
      // body: STATIC_ASSETS_304_CSS,
      // contentType: 'text/css',
      // headers: {
      //   'cache-control': 'public, max-age=31536000, immutable',
      //   etag: '1234567890abcdef'
      // },
      status: 304
    } as unknown as Response);
  });
});
