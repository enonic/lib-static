import {
  beforeAll,
  describe,
  expect,
  test as it
} from '@jest/globals';
import {
  ERROR_MESSAGE_PATH_SLASH_OR_EMPTY
} from '../main/resources/lib/enonic/static/path/getPathError';
import {
  errorMessageTemplateFirstArgumentMissing
} from '../main/resources/lib/enonic/static/options/verifyAndTrimPathOrRoot';
import { mockJava } from './mockJava';
import {
  badRequestResponse,
  internalServerErrorResponse,
  notFoundResponse,
  okResponse,
  silenceLogError
} from './expectations';
import { STATIC_ASSETS_200_CSS } from './testdata';


beforeAll((done) => {
  mockJava({
    devMode: true,
    resources: {
      '/static/assets/200.css': {
        bytes: STATIC_ASSETS_200_CSS,
        etag: null,
        exists: true,
        mimeType: 'text/css',
      },
      '/static/assets/404.css': {
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
        expect(get('')).toEqual(badRequestResponse({
          body: `Resource path '' ${ERROR_MESSAGE_PATH_SLASH_OR_EMPTY}`
        }));
      });
    });

    it('returns bad request when path is /', () => {
      import('../main/resources/lib/enonic/static').then(({ get }) => {
        expect(get('/')).toEqual(badRequestResponse({
          body: `Resource path '' ${ERROR_MESSAGE_PATH_SLASH_OR_EMPTY}`
        }));
      });
    });

    it('returns not found response when resource is not found', () => {
      const root = 'static';
      const path = `${root}/assets/404.css`;
      import('../main/resources/lib/enonic/static').then(({ get }) => {
        expect(get(path)).toEqual(notFoundResponse);
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
