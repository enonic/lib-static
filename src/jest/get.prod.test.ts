import {
  beforeAll,
  describe,
  expect,
  // jest,
  test as it
} from '@jest/globals';
// import {
//   ERROR_MESSAGE_PATH_SLASH_OR_EMPTY
// } from '../main/resources/lib/enonic/static/path/getPathError';
import {
  errorMessageTemplateFirstArgumentMissing
} from '../main/resources/lib/enonic/static/options/verifyAndTrimPathOrRoot';
import { mockJava } from './mockJava';
import { STATIC_ASSETS_200_CSS } from './setupFile';
import {
  // badRequestResponse,
  internalServerErrorResponse,
  // notFoundResponse,
  okResponse,
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
      '/static/assets/400.css': {
        exists: false,
        mimeType: 'text/css',
      }
    }
  });
  done();
});


describe('get', () => {

  describe('Successful responses', () => {
    it('returns 200 OK when resource is found', () => {
      import('../main/resources/lib/enonic/static').then(({ get }) => {
        expect(get('/static/assets/200.css')).toEqual(okResponse({
          body: STATIC_ASSETS_200_CSS,
          contentType: 'text/css',
          headers: {
            'cache-control': 'public, max-age=31536000, immutable',
            // TODO: Seems weird to return both etag and immuteable!!!
            etag: '1234567890abcdef'
          },
        }));
      });
    });
  }); // describe Successful responses

  describe('Error responses', () => {
    it('returns server error', () => {
      import('../main/resources/lib/enonic/static').then(({ get }) => {
        // @ts-expect-error missing param
        silenceLogError(() => expect(get()).toEqual(internalServerErrorResponse));
      });
    });

    it('returns bad request when path is empty', () => {
      import('../main/resources/lib/enonic/static').then(({ get }) => {
        // expect(get('')).toEqual(badRequestResponse({ // dev mode
        //   body: `Resource path '' ${ERROR_MESSAGE_PATH_SLASH_OR_EMPTY}`
        // }));
        // No body or contentType in prod mode
        expect(get('')).toEqual({ status: 400 });
      });
    });

    it('returns bad request when path is /', () => {
      import('../main/resources/lib/enonic/static').then(({ get }) => {
        // expect(get('/')).toEqual(badRequestResponse({
        //   body: `Resource path '' ${ERROR_MESSAGE_PATH_SLASH_OR_EMPTY}`
        // }));
        // No body or contentType in prod mode
        expect(get('/')).toEqual({ status: 400 });
      });
    });

    it('returns not found response when resource is not found', () => {
      const root = 'static';
      const path = `${root}/assets/400.css`;
      import('../main/resources/lib/enonic/static').then(({ get }) => {
        // expect(get(path)).toEqual(notFoundResponse); // dev mode
        // No body or contentType in prod mode
        expect(get(path)).toEqual({ status: 404 });
      });
    });
  }); // describe Error responses

  describe('throwErrors', () => {

    it('throws when the only option is throwErrors', () => {
      import('../main/resources/lib/enonic/static').then(({ get }) => {
        // @ts-expect-error missing param
        expect(() => get({
          throwErrors: true
        })).toThrow(errorMessageTemplateFirstArgumentMissing('path'));
      });
    });

    it('throws when path is null, and throwErrors: true', () => {
      import('../main/resources/lib/enonic/static').then(({ get }) => {
        expect(() => get(null, {
          throwErrors: true
        })).toThrow(errorMessageTemplateFirstArgumentMissing('path'));
      });
    });

    it('throws when path is undefined, and throwErrors: true', () => {
      import('../main/resources/lib/enonic/static').then(({ get }) => {
        expect(() => get(undefined, {
          throwErrors: true
        })).toThrow(errorMessageTemplateFirstArgumentMissing('path'));
      });
    });

  }); // describe throwErrors

}); // describe get
