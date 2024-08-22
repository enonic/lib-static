import {
  describe,
  expect,
  test as it
} from '@jest/globals';
import {
  buildRequest,
  internalServerErrorResponse
} from '../expectations';
import { STATIC_ASSETS_200_CSS } from '../testdata';

describe('static service in prod mode', () => {
  it('responds with 500 Internal Server Error when throwErrors = false', () => {
    const appName = 'com.example.myproject'; // globalThis.app.name
    const routingUnderWebapp = 'assets';
    const contextPath = `/webapp/${appName}`
    const filename = '500-1234567890abcdef.css';
    // const unVhostedPath = `/webapp/${appName}/${routingUnderWebapp}/${filename}`;
    const vhostedPath = `/mapping/${routingUnderWebapp}/${filename}`;
    const request = buildRequest({
      contextPath,
      path: vhostedPath,
      rawPath: `${contextPath}/assets/${filename}`
    });
    import('../../main/resources/lib/enonic/static/service/handleResourceRequest').then(({ handleResourceRequest }) => {
      expect(handleResourceRequest({
          request,
          // throwErrors: false
      })).toEqual(internalServerErrorResponse);
    }); // import
  }); // it

  it('throws when throwErrors = true', () => {
    const appName = 'com.example.myproject'; // globalThis.app.name
    const routingUnderWebapp = 'assets';
    const contextPath = `/webapp/${appName}`
    const filename = '500-1234567890abcdef.css';
    // const unVhostedPath = `/webapp/${appName}/${routingUnderWebapp}/${filename}`;
    const vhostedPath = `/mapping/${routingUnderWebapp}/${filename}`;
    const request = buildRequest({
      contextPath,
      path: vhostedPath,
      rawPath: `${contextPath}/assets/${filename}`
    });
    import('../../main/resources/lib/enonic/static/service/handleResourceRequest').then(({ handleResourceRequest }) => {
      const fn = () => handleResourceRequest({
        request,
        throwErrors: true
      });
      expect(fn).toThrow('Manually thrown error :)');
    }); // import
  }); // it

  it('handles custom root', () => {
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
    import('../../main/resources/lib/enonic/static/service/handleResourceRequest').then(({ handleResourceRequest }) => {
      const fn200 = () => handleResourceRequest({
        request,
      });
      expect(fn200()).toEqual({
        body: STATIC_ASSETS_200_CSS,
        contentType: 'text/css',
        headers: {
          'cache-control': 'public, max-age=31536000, immutable',
        },
        status: 200
      });

      const fn404 = () => handleResourceRequest({
        request,
        root: 'mycustomstaticfolder',
      });
      expect(fn404()).toEqual({
        status: 404
      });
    }); // import
  }); // it

});
