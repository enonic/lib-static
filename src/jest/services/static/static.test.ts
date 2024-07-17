import type { getResource as getResourceValue } from '@enonic-types/lib-io';
// import type { Router } from '@item-enonic-types/lib-router';
import type {
  Request,
  Response
} from '../../../main/resources/lib/enonic/static/types';

import {
  beforeAll,
  describe,
  expect,
  jest,
  test as it
} from '@jest/globals';
import { buildRequest } from '../../expectations';
import { Resource } from '../../Resource';
import { STATIC_ASSETS_200_CSS } from '../../testdata';

const handlers: Record<string,(request: Request) => Response> = {};

beforeAll((done) => {
  jest.mock('/lib/router', () => ({
    __esModule: true,
    default: jest.fn(() => ({
      get: jest.fn((_pattern: string, handler: (request: Request) => Response) => {
        // console.debug('get', _pattern);
        handlers.get = handler;
      }),
      dispatch: jest.fn((request: Request) => {
        // console.debug('dispatch', request);
        return handlers.get(request);
      })
    }))
  }), { virtual: true });

  jest.mock('/lib/xp/io', () => ({
    getResource: jest.fn<typeof getResourceValue>((key) => {
      if (key === '/static/assets/200.css') {
        return new Resource({
          bytes: STATIC_ASSETS_200_CSS,
          exists: true,
          key: key.toString(),
          size: STATIC_ASSETS_200_CSS.length,
          timestamp: Date.now()
        });
      }
      // console.debug('getResource', key);
      return {
        exists: () => false,
        // Never gets called in this test :)
        // getBytes: () => {
        //   console.debug('getBytes');
        // },
        // getSize: () => {
        //   console.debug('getSize');
        // },
        // getStream: () => {
        //   console.debug('getStream');
        // },
        // getTimestamp: () => {
        //   console.debug('getTimestamp');
        // }
      } as Resource;
    })
  }), { virtual: true });

  done();
}); // beforeAll


describe('static service', () => {
  it('returns immuteable response when request path contains correct contenthash', () => {
    const appName = 'com.example.myproject'; // globalThis.app.name
    const routingUnderWebapp = 'assets';
    const contextPath = `/webapp/${appName}`
    const filename = '200-1234567890abcdef.css';
    // const unVhostedPath = `/webapp/${appName}/${routingUnderWebapp}/${filename}`;
    const vhostedPath = `/mapping/${routingUnderWebapp}/${filename}`;
    const request = buildRequest({
      contextPath,
      path: vhostedPath,
      rawPath: `${contextPath}/assets/${filename}`
    });
    import('../../../main/resources/services/static/static').then(({ all }) => {
      expect(all(request)).toEqual({
        body: STATIC_ASSETS_200_CSS,
        contentType: 'text/css',
        headers: {
          'cache-control': 'public, max-age=31536000, immutable',
        },
        status: 200
      }); // expect
    }); // import
  }); // it

  it('returns 304 Not modified when request if-none-match header matches resource etag, even when url has contenthash', () => {
    const appName = 'com.example.myproject'; // globalThis.app.name
    const routingUnderWebapp = 'assets';
    const contextPath = `/webapp/${appName}`
    const filename = '200-1234567890abcdef.css';
    // const unVhostedPath = `/webapp/${appName}/${routingUnderWebapp}/${filename}`;
    const vhostedPath = `/mapping/${routingUnderWebapp}/${filename}`;
    const request = buildRequest({
      contextPath,
      headers: {
        'if-none-match': '"1234567890abcdef"'
      },
      path: vhostedPath,
      rawPath: `${contextPath}/assets/${filename}`
    });
    import('../../../main/resources/services/static/static').then(({ all }) => {
      expect(all(request)).toEqual({
        status: 304
      }); // expect
    }); // import
  }); // it

  it("falls back to etag response when the request path contenthash doesn't match resource etag", () => {
    const appName = 'com.example.myproject'; // globalThis.app.name
    const routingUnderWebapp = 'assets';
    const contextPath = `/webapp/${appName}`
    const filename = '200-whatever.css';
    // const unVhostedPath = `/webapp/${appName}/${routingUnderWebapp}/${filename}`;
    const vhostedPath = `/mapping/${routingUnderWebapp}/${filename}`;
    const request = buildRequest({
      contextPath,
      path: vhostedPath,
      rawPath: `${contextPath}/assets/${filename}`
    });
    import('../../../main/resources/services/static/static').then(({ all }) => {
      expect(all(request)).toEqual({
        body: STATIC_ASSETS_200_CSS,
        contentType: 'text/css',
        headers: {
          'cache-control': 'no-cache',
          etag: '"1234567890abcdef"'
        },
        status: 200
      }); // expect
    }); // import
  }); // it

  it('returns etag response when request path is without contenthash', () => {
    const appName = 'com.example.myproject'; // globalThis.app.name
    const routingUnderWebapp = 'assets';
    const contextPath = `/webapp/${appName}`
    const filename = '200.css';
    // const unVhostedPath = `/webapp/${appName}/${routingUnderWebapp}/${filename}`;
    const vhostedPath = `/mapping/${routingUnderWebapp}/${filename}`;
    const request = buildRequest({
      contextPath,
      path: vhostedPath,
      rawPath: `${contextPath}/assets/${filename}`
    });
    import('../../../main/resources/services/static/static').then(({ all }) => {
      expect(all(request)).toEqual({
        body: STATIC_ASSETS_200_CSS,
        contentType: 'text/css',
        headers: {
          'cache-control': 'no-cache',
          etag: '"1234567890abcdef"'
        },
        status: 200
      }); // expect
    }); // import
  }); // it

  it('returns 304 Not modified when request if-none-match header matches resource etag', () => {
    const appName = 'com.example.myproject'; // globalThis.app.name
    const routingUnderWebapp = 'assets';
    const contextPath = `/webapp/${appName}`
    const filename = '200.css';
    // const unVhostedPath = `/webapp/${appName}/${routingUnderWebapp}/${filename}`;
    const vhostedPath = `/mapping/${routingUnderWebapp}/${filename}`;
    const request = buildRequest({
      contextPath,
      headers: {
        'if-none-match': '"1234567890abcdef"'
      },
      path: vhostedPath,
      rawPath: `${contextPath}/assets/${filename}`
    });
    import('../../../main/resources/services/static/static').then(({ all }) => {
      expect(all(request)).toEqual({
        status: 304
      }); // expect
    }); // import
  }); // it

  it('returns 404 Not found when no resource is found', () => {
    const appName = 'com.example.myproject'; // globalThis.app.name
    const routingUnderWebapp = 'assets';
    const contextPath = `/webapp/${appName}`
    const filename = '404.css';
    // const unVhostedPath = `/webapp/${appName}/${routingUnderWebapp}/${filename}`;
    const vhostedPath = `/mapping/${routingUnderWebapp}/${filename}`;
    const request = buildRequest({
      contextPath,
      path: vhostedPath,
      rawPath: `${contextPath}/assets/${filename}`
    });
    import('../../../main/resources/services/static/static').then(({ all }) => {
      expect(all(request)).toEqual({
        status: 404
      }); // expect
    }); // import
  }); // it

  it('returns 400 Bad Request when the request path contains illegal chars <', () => {
    const appName = 'com.example.myproject'; // globalThis.app.name
    const routingUnderWebapp = 'assets';
    const contextPath = `/webapp/${appName}`
    const filename = '<';
    const encodedFileName = '%3C';
    // const unVhostedPath = `/webapp/${appName}/${routingUnderWebapp}/${filename}`;
    const vhostedPath = `/mapping/${routingUnderWebapp}/${encodedFileName}`;
    const request = buildRequest({
      contextPath,
      path: vhostedPath,
      rawPath: `${contextPath}/assets/${filename}`
    });
    import('../../../main/resources/services/static/static').then(({ all }) => {
      expect(all(request)).toEqual({
        status: 400
      }); // expect
    }); // import
  }); // it
}); // describe
