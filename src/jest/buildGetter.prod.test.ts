import type {
  Request,
  Response
} from '../main/resources/lib/enonic/static/types';

import {
  beforeAll,
  describe,
  expect,
  test as it
} from '@jest/globals';
// import {buildGetter} from '../main/resources/lib/enonic/static';
// import libStatic from '../main/resources/lib/enonic/static';
import {
  INDEX_HTML,
  STATIC_ASSETS_200_CSS,
  STATIC_ASSETS_304_CSS
} from './setupFile';
import { mockJava } from './mockJava';
import {
  buildRequest,
  internalServerErrorResponse,
  notFoundResponse,
  silenceLogError
} from './testdata';

beforeAll((done) => {
  mockJava({
    devMode: false,
    resources: {
      '/static/assets/200.css': {
        bytes: STATIC_ASSETS_200_CSS,
        etag: '1234567890abcdef',
        exists: true,
        mimeType: 'text/css',
      },
      '/static/assets/303.css': {
        exists: false,
        mimeType: 'text/css',
      },
      '/static/assets/303.css/index.html': {
        bytes: INDEX_HTML,
        etag: '1234567890abcdef',
        exists: true,
        mimeType: 'text/html',
      },
      '/static/assets/304.css': {
        bytes: STATIC_ASSETS_304_CSS,
        etag: '1234567890abcdef',
        exists: true,
        mimeType: 'text/css',
      },
      '/static/assets/400.css': {
        exists: false,
        mimeType: 'text/css',
      },
      '/static/assets/400.css/index.html': {
        exists: false,
        mimeType: 'text/html',
      },
      '/static/assets/trailingSlash.css/': {
        exists: false,
        mimeType: 'text/css',
      },
      '/static/assets/trailingSlash.css/index.html': {
        bytes: INDEX_HTML,
        exists: true,
        etag: '1234567890abcdef',
        mimeType: 'text/html',
      }
    }
  });
  done();
});

describe('buildGetter', () => {

  describe('Successful responses', () => {

    it('no options', () => {
      const root = 'static';
      // In starter-tsup 'static' is used. No start or end slash.
      import('../main/resources/lib/enonic/static').then(({ buildGetter }) => {
        const getter = buildGetter(root);
        expect(getter).toBeInstanceOf(Function);

        // @ts-expect-error missing param
        silenceLogError(() => expect(getter()).toEqual(internalServerErrorResponse));

        const appName = 'com.example.myproject'; // globalThis.app.name
        const routingUnderWebapp = 'assets';
        const contextPath = `/webapp/${appName}`
        // const unVhostedPath = `/webapp/${appName}/${routingUnderWebapp}/200.css`;
        const vhostedPath = `/mapping/${routingUnderWebapp}/200.css`;
        const request = buildRequest({
          contextPath,
          path: vhostedPath,
          rawPath: `${contextPath}/assets/200.css`
        });
        expect(getter(request)).toEqual({
          body: STATIC_ASSETS_200_CSS,
          contentType: 'text/css',
          headers: {
            'cache-control': 'public, max-age=31536000, immutable',
            // TODO Seems weird to return both etag and immuteable!!!
            etag: '1234567890abcdef'
          },
          status: 200
        });
      });
    });

  }); // describe Successful responses

  describe('Errors', () => {

    it('throws when there are no params', () => {
      // @ts-expect-error missing param
      expect(() => buildGetter()).toThrow();
    });

    it('request object without rawpath', () => {
      const request = {} as Request;

      import('../main/resources/lib/enonic/static').then(({ buildGetter }) => {
        const getterWithoutThrowErrors = buildGetter('myroot');
        silenceLogError(() => expect(getterWithoutThrowErrors(request)).toEqual(internalServerErrorResponse));

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
      import('../main/resources/lib/enonic/static').then(({ buildGetter }) => {
        const getterWithoutThrowErrors = buildGetter(root);
        expect(getterWithoutThrowErrors(request)).toEqual({
          // No body, nor contentType in prod mode
          // body: expect.stringMatching(/^Illegal absolute resource path '.+' \(resolved relative path: '.+'\) can't contain '..' or any of these characters: \\ | ? * < > ' \" ` ´$/),
          // contentType: "text/plain; charset=utf-8",
          status: 400
        } as unknown as Response)
      });
    });

    it('handles 400 Bad Request', () => {
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
      import('../main/resources/lib/enonic/static').then(({ buildGetter }) => {
        const getterWithoutThrowErrors = buildGetter(root);
        // expect(getterWithoutThrowErrors(request)).toEqual(notFoundResponse);
        // No body, nor contentType in prod mode
        expect(getterWithoutThrowErrors(request)).toEqual({ status: 404 });
      });
    });

    it('handles 303 See Other', () => {
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
      import('../main/resources/lib/enonic/static').then(({ buildGetter }) => {
        const getterWithoutThrowErrors = buildGetter(root);
        expect(getterWithoutThrowErrors(request)).toEqual({
          redirect: '/webapp/com.example.myproject/assets/303.css/'
        } as unknown as Response);
      });
    });

    it('handles trailing slash with fallback to index.html', () => {
      const root = 'static';
      import('../main/resources/lib/enonic/static').then(({ buildGetter }) => {
        const getterWithoutThrowErrors = buildGetter(root);

        const appName = 'com.example.myproject'; // globalThis.app.name
        const routingUnderWebapp = 'assets';
        const contextPath = `/webapp/${appName}`
        // const unVhostedPath = `/webapp/${appName}/${routingUnderWebapp}/trailingSlash.css/`;
        const vhostedPath = `/mapping/${routingUnderWebapp}/trailingSlash.css/`;
        const request = buildRequest({
          contextPath,
          path: vhostedPath,
          rawPath: `${contextPath}/assets/trailingSlash.css/`
        });
        expect(getterWithoutThrowErrors(request)).toEqual({
          body: INDEX_HTML,
          contentType: 'text/html',
          headers: {
            'cache-control': 'no-cache',
            // TODO Seems weird to return both etag and immuteable!!!
            etag: '1234567890abcdef'
          },
          status: 200
        });
      });
    });

    it('handles 304 Not Modified', () => {
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
      import('../main/resources/lib/enonic/static').then(({ buildGetter }) => {
        const getterWithoutThrowErrors = buildGetter(root);
        expect(getterWithoutThrowErrors(request)).toEqual({
          // body: STATIC_ASSETS_304_CSS,
          // contentType: 'text/css',
          // headers: {
          //   'cache-control': 'public, max-age=31536000, immutable',
          //   etag: '1234567890abcdef'
          // },
          status: 304 // No etag in dev mode, thus no Not modified
          // status: 200
        } as unknown as Response);
      });
    });

  }); // describe Errors

});