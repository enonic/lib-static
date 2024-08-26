import {
  describe,
  expect,
  test as it
} from '@jest/globals';
import {
  buildRequest,
  // internalServerErrorResponse
} from '../expectations';

describe('etagRequestHandler', () => {
  it('responds with 200 ok and etag when resource found', () => {
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
    import('../../main/resources/lib/enonic/static/service/etagRequestHandler').then(({ etagRequestHandler }) => {
      expect(etagRequestHandler({
        request
      })).toEqual({
        body: 'body { color: green; }',
        contentType: 'text/css',
        headers: {
          'cache-control': 'max-age=3600',
          etag: '"1234567890abcdef"'
        },
        status: 200
      }); // expect
    }); // import
  }); // it

  it('responds with 400 error when path is illegal', () => {
    const appName = 'com.example.myproject'; // globalThis.app.name
    const routingUnderWebapp = 'assets';
    const contextPath = `/webapp/${appName}`
    const filename = '<';
    // const unVhostedPath = `/webapp/${appName}/${routingUnderWebapp}/${filename}`;
    const vhostedPath = `/mapping/${routingUnderWebapp}/${filename}`;
    const request = buildRequest({
      contextPath,
      path: vhostedPath,
      rawPath: `${contextPath}/assets/${filename}`
    });
    import('../../main/resources/lib/enonic/static/service/etagRequestHandler').then(({ etagRequestHandler }) => {
      expect(etagRequestHandler({
        request
      })).toEqual({
        status: 400
      }); // expect
    }); // import
  }); // it

  it('responds with 304 Not modified when if-none-match matches etag', () => {
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
    import('../../main/resources/lib/enonic/static/service/etagRequestHandler').then(({ etagRequestHandler }) => {
      expect(etagRequestHandler({
        request
      })).toEqual({
        status: 304
      }); // expect
    }); // import
  }); // it

  it('responds with 404 Not found when resource not found', () => {
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
    import('../../main/resources/lib/enonic/static/service/etagRequestHandler').then(({ etagRequestHandler }) => {
      expect(etagRequestHandler({
        request
      })).toEqual({
        status: 404
      }); // expect
    }); // import
  }); // it

  it('handles etagCacheControlHeader and getContentType parameters', () => {
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
    import('../../main/resources/lib/enonic/static/service/etagRequestHandler').then(({ etagRequestHandler }) => {
      expect(etagRequestHandler({
        etagCacheControlHeader: 'no-cache',
        getContentType: () => 'my/type',
        request
      })).toEqual({
        body: 'body { color: green; }',
        contentType: 'my/type',
        headers: {
          'cache-control': 'no-cache',
          etag: '"1234567890abcdef"'
        },
        status: 200
      }); // expect
    }); // import
  }); // it

  it("handles etagProcessing = 'never' parameter", () => {
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
    import('../../main/resources/lib/enonic/static/service/etagRequestHandler').then(({ etagRequestHandler }) => {
      expect(etagRequestHandler({
        etagProcessing: 'never',
        request
      })).toEqual({
        body: 'body { color: green; }',
        contentType: 'text/css',
        headers: {
          'cache-control': 'no-cache',
        },
        status: 200
      }); // expect
    }); // import
  }); // it

  it('handles custom root', () => {
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
    import('../../main/resources/lib/enonic/static/service/etagRequestHandler').then(({ etagRequestHandler }) => {
      expect(etagRequestHandler({
        request,
        root: '/custom/root'
      })).toEqual({
        body: 'body { color: green; }',
        contentType: 'text/css',
        headers: {
          'cache-control': 'max-age=3600',
          etag: '"1234567890abcdef"'
        },
        status: 200
      }); // expect
    }); // import
  }); // it

  it('throws when throwErrors = true', () => {
    const appName = 'com.example.myproject'; // globalThis.app.name
    const routingUnderWebapp = 'assets';
    const contextPath = `/webapp/${appName}`
    const filename = '500.css';
    // const unVhostedPath = `/webapp/${appName}/${routingUnderWebapp}/${filename}`;
    const vhostedPath = `/mapping/${routingUnderWebapp}/${filename}`;
    const request = buildRequest({
      contextPath,
      path: vhostedPath,
      rawPath: `${contextPath}/assets/${filename}`
    });
    import('../../main/resources/lib/enonic/static/service/etagRequestHandler').then(({ etagRequestHandler }) => {
      expect(() => etagRequestHandler({
        request,
        throwErrors: true
      })).toThrow('Manually thrown error :)'); // expect
    }); // import
  }); // it
}); // describe
