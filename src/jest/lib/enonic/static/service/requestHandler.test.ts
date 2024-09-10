import {
  describe,
  expect,
  jest,
  test as it
} from '@jest/globals';
import {
  RESPONSE_CACHE_CONTROL,
  HTTP2_RESPONSE_HEADER,
  RESPONSE_CACHE_CONTROL_DIRECTIVE,
} from '/lib/enonic/static/constants';
import { mockEtagService } from '../../../../mocks/etagService';
import { mockIoService } from '../../../../mocks/ioService';
import {
  buildRequest,
  // internalServerErrorResponse
} from '../../../../expectations';
import {
  STATIC_ASSETS_200_CSS,
  STATIC_ASSETS_INDEX_HTML,
} from '../../../../testdata';


describe('requestHandler', () => {
  it('responds with 200 ok when resource found', () => {
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
    import('../../../../../main/resources/lib/enonic/static').then(({ requestHandler }) => {
      expect(requestHandler({
        request
      })).toEqual({
        body: 'body { color: green; }',
        contentType: 'text/css',
        headers: {
          [HTTP2_RESPONSE_HEADER.CACHE_CONTROL]: RESPONSE_CACHE_CONTROL.SAFE,
          [HTTP2_RESPONSE_HEADER.ETAG]: '"1234567890abcdef"'
        },
        status: 200
      }); // expect
    }); // import
  }); // it

  it('responds with 301 Moved Permanently when resource isDirectory and rawPath no trailing slash', () => {
    const appName = 'com.example.myproject'; // globalThis.app.name
    const routingUnderWebapp = 'assets';
    const contextPath = `/webapp/${appName}`
    const vhostedPath = `/mapping/${routingUnderWebapp}`;
    const request = buildRequest({
      contextPath,
      path: vhostedPath,
      rawPath: `${contextPath}/assets`
    });
    import('../../../../../main/resources/lib/enonic/static').then(({ requestHandler }) => {
      expect(requestHandler({
        request
      })).toEqual({
        headers: {
          location: `${vhostedPath}/`,
        },
        status: 301
      }); // expect
    }); // import
  }); // it

  it('responds with index when request.rawPath endsWith slash', () => {
    const appName = 'com.example.myproject'; // globalThis.app.name
    const routingUnderWebapp = 'assets';
    const contextPath = `/webapp/${appName}`
    const filename = '200.css/';
    // const unVhostedPath = `/webapp/${appName}/${routingUnderWebapp}/${filename}`;
    const vhostedPath = `/mapping/${routingUnderWebapp}/${filename}`;
    const request = buildRequest({
      contextPath,
      path: vhostedPath,
      rawPath: `${contextPath}/assets/${filename}`
    });
    import('../../../../../main/resources/lib/enonic/static').then(({ requestHandler }) => {
      expect(requestHandler({
        request
      })).toEqual({
        body: STATIC_ASSETS_INDEX_HTML,
        contentType: 'text/css',
        headers: {
          [HTTP2_RESPONSE_HEADER.CACHE_CONTROL]: RESPONSE_CACHE_CONTROL.SAFE,
          [HTTP2_RESPONSE_HEADER.ETAG]: '"static_assets_200_css_index_html"'
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
    import('../../../../../main/resources/lib/enonic/static').then(({ requestHandler }) => {
      expect(requestHandler({
        request
      })).toEqual({
        status: 400
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
    import('../../../../../main/resources/lib/enonic/static').then(({ requestHandler }) => {
      expect(requestHandler({
        request
      })).toEqual({
        status: 404
      }); // expect
    }); // import
  }); // it

  it("responds with 304 Not modified when if-none-match matches etag", () => {
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
    import('../../../../../main/resources/lib/enonic/static').then(({ requestHandler }) => {
      expect(requestHandler({
        request
      })).toEqual({
        status: 304
      }); // expect
    }); // import
  }); // it

  // NOTE: This test resets modules, so it should be after tests that uses default mocks.
  it('responds without etag, when cacheControl contains immutable', () => {
    jest.resetModules();
    globalThis._resources = {
      '/static/assets/200.css': {
        bytes: STATIC_ASSETS_200_CSS,
        etag: '1234567890abcdef',
        exists: true,
        mimeType: 'text/css',
      },
    };
    // @ts-ignore
    globalThis.__.newBean = (bean: string) => {
      if (bean === 'lib.enonic.libStatic.AppHelper') {
        return {
          isDevMode: () => false
        };
      }
      if (bean === 'lib.enonic.libStatic.etag.EtagService') {
        return mockEtagService();
      }
      if (bean === 'lib.enonic.libStatic.IoService') {
        return mockIoService();
      }
      throw new Error(`Unmocked bean:${bean}!`);
    }
    const appName = 'com.example.myproject'; // globalThis.app.name
    const routingUnderWebapp = 'assets';
    const contextPath = `/webapp/${appName}`
    const filename = '200.css';
    const vhostedPath = `/mapping/${routingUnderWebapp}/${filename}`;
    const request = buildRequest({
      contextPath,
      path: vhostedPath,
      rawPath: `${contextPath}/assets/${filename}`
    });
    import('../../../../../main/resources/lib/enonic/static').then(({ requestHandler }) => {
      expect(requestHandler({
        request
      })).toEqual({
        body: 'body { color: green; }',
        contentType: 'text/css',
        headers: {
          [HTTP2_RESPONSE_HEADER.CACHE_CONTROL]: 'immutable',
        },
        status: 200
      }); // expect
    }); // import
  }); // it

  // NOTE: This test resets modules, so it should be after tests that uses default mocks.
  // it('responds without etag, when etag configured to off', () => {
  //   jest.resetModules();
  //   globalThis._resources = {
  //     '/static/assets/200.css': {
  //       bytes: STATIC_ASSETS_200_CSS,
  //       etag: '1234567890abcdef',
  //       exists: true,
  //       mimeType: 'text/css',
  //     },
  //   };
  //   // @ts-ignore
  //   globalThis.__.newBean = (bean: string) => {
  //     if (bean === 'lib.enonic.libStatic.AppHelper') {
  //       return {
  //         isDevMode: () => false
  //       };
  //     }
  //     if (bean === 'lib.enonic.libStatic.etag.EtagService') {
  //       return mockEtagService();
  //     }
  //     if (bean === 'lib.enonic.libStatic.IoService') {
  //       return mockIoService();
  //     }
  //     throw new Error(`Unmocked bean:${bean}!`);
  //   }
  //   const appName = 'com.example.myproject'; // globalThis.app.name
  //   const routingUnderWebapp = 'assets';
  //   const contextPath = `/webapp/${appName}`
  //   const filename = '200.css';
  //   const vhostedPath = `/mapping/${routingUnderWebapp}/${filename}`;
  //   const request = buildRequest({
  //     contextPath,
  //     path: vhostedPath,
  //     rawPath: `${contextPath}/assets/${filename}`
  //   });
  //   import('../../../../../main/resources/lib/enonic/static').then(({ requestHandler }) => {
  //     expect(requestHandler({
  //       request
  //     })).toEqual({
  //       body: 'body { color: green; }',
  //       contentType: 'text/css',
  //       headers: {
  //         [HTTP2_RESPONSE_HEADER.CACHE_CONTROL]: RESPONSE_CACHE_CONTROL.SAFE,
  //       },
  //       status: 200
  //     }); // expect
  //   }); // import
  // }); // it

  // NOTE: This test resets modules, so it should be after tests that uses default mocks.
  it('responds with no_store in dev mode', () => {
    jest.resetModules();
    globalThis._resources = {
      '/com.enonic.lib.static.json': {
        exists: false,
      },
      '/static/assets/200.css': {
        bytes: STATIC_ASSETS_200_CSS,
        etag: 'SHOULD_NOT_APPEAR',
        exists: true,
        mimeType: 'text/css',
      },
    };
    // @ts-ignore
    globalThis.__.newBean = (bean: string) => {
      if (bean === 'lib.enonic.libStatic.AppHelper') {
        return {
          isDevMode: () => true
        };
      }
      if (bean === 'lib.enonic.libStatic.etag.EtagService') {
        return mockEtagService();
      }
      if (bean === 'lib.enonic.libStatic.IoService') {
        return mockIoService();
      }
      throw new Error(`Unmocked bean:${bean}!`);
    }
    const appName = 'com.example.myproject'; // globalThis.app.name
    const routingUnderWebapp = 'assets';
    const contextPath = `/webapp/${appName}`
    const filename = '200.css';
    const vhostedPath = `/mapping/${routingUnderWebapp}/${filename}`;
    const request = buildRequest({
      contextPath,
      path: vhostedPath,
      rawPath: `${contextPath}/assets/${filename}`
    });
    import('../../../../../main/resources/lib/enonic/static').then(({ requestHandler }) => {
      expect(requestHandler({ request })).toEqual({
        body: 'body { color: green; }',
        contentType: 'text/css',
        headers: {
          [HTTP2_RESPONSE_HEADER.CACHE_CONTROL]: RESPONSE_CACHE_CONTROL_DIRECTIVE.NO_STORE
        },
        status: 200
      }); // expect
    }); // import
  }); // it
}); // describe
