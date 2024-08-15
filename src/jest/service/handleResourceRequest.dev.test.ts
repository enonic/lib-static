import {
  beforeAll,
  describe,
  expect,
  test as it
} from '@jest/globals';
import { mockJava } from '../mockJava';
import {
  buildRequest,
  internalServerErrorResponse
} from '../expectations';
import { STATIC_ASSETS_200_CSS } from '../testdata';


beforeAll((done) => {
  mockJava({
    devMode: true,
    resources: {
      '/static/assets/200.css': {
        bytes: STATIC_ASSETS_200_CSS,
        etag: '1234567890abcdef',
        exists: true,
        mimeType: 'text/css',
      },
    }
  });
  done();
});


describe('static service in dev mode', () => {
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
    import('../../main/resources/lib/enonic/static/service/handleResourceRequest').then(({ handleResourceRequest }) => {
      expect(handleResourceRequest({request})).toEqual({
        body: "can't contain '..' or any of these characters: \\ | ? * < > ' \" ` ´",
        contentType: 'text/plain; charset=utf-8',
        status: 400
      }); // expect
    }); // import
  }); // it

  it("uses getContentHashMismatchResponse when the request path contenthash doesn't match resource etag", () => {
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
    import('../../main/resources/lib/enonic/static/service/handleResourceRequest').then(({ handleResourceRequest }) => {
      import('../../main/resources/lib/enonic/static/response/headers/getEtagHeaders').then(({ getEtagHeaders }) => {
        expect(handleResourceRequest({
          getContentHashMismatchResponse: ({ contentHash, contentType, etag, resource }) => {
            log.debug('contentHash: %s, contentType: %s, etag: %s, resource: %s', contentHash, contentType, etag, resource);
            return {
              body: resource.getStream(),
              contentType,
              headers: getEtagHeaders({ etagWithDblFnutts: etag }),
              status: 200
            }
          },
          request,
        })).toEqual({
          body: STATIC_ASSETS_200_CSS,
          contentType: 'text/css',
          headers: {
            'cache-control': 'no-cache',
            etag: '"1234567890abcdef"'
          },
          status: 200
        }); // expect
      }); // import getEtagHeaders
    }); // import handleResourceRequest
  }); // it

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
      expect(() => handleResourceRequest({
        request,
        throwErrors: true
      })).toThrow('Manually thrown error :)');
    }); // import
  }); // it
});
