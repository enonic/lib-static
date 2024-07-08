import {
  describe,
  expect,
  // jest,
  test as it
} from '@jest/globals';
import {
  ERROR_MESSAGE_PATH_SLASH_OR_EMPTY,
  get
} from '../main/resources/lib/enonic/static';
import {
  errorMessageTemplateFirstArgumentMissing
} from '../main/resources/lib/enonic/static/options';
import { INDEX_HTML } from './setupFile';
import {
  badRequestResponse,
  internalServerErrorResponse,
  notFoundResponse,
  okResponse,
  silenceLogError
} from './testdata';



describe('get', () => {

  describe('Successful responses', () => {
    it('returns 200 OK when resource is found', () => {
      expect(get('/myrootindex.html')).toEqual(okResponse({
        body: INDEX_HTML,
        headers: {
          'cache-control': 'public, max-age=31536000, immutable',
          etag: '1234567890abcdef'
        },
      }));
    });
  }); // describe Successful responses

  describe('Error responses', () => {
    it('returns server error', () => {
      // @ts-expect-error missing param
      silenceLogError(() => expect(get()).toEqual(internalServerErrorResponse));
    });

    it('returns bad request when path is empty', () => {
      expect(get('')).toEqual(badRequestResponse({
        body: `Resource path '' ${ERROR_MESSAGE_PATH_SLASH_OR_EMPTY}`
      }));
    });

    it('returns bad request when path is /', () => {
      expect(get('/')).toEqual(badRequestResponse({
        body: `Resource path '' ${ERROR_MESSAGE_PATH_SLASH_OR_EMPTY}`
      }));
    });

    it('returns not found response when resource is not found', () => {
      const root = 'static';
      const path = `${root}/assets/400.css`;
      expect(get(path)).toEqual(notFoundResponse);
    });
  }); // describe Error responses

  describe('throwErrors', () => {

    it('throws when the only option is throwErrors', () => {
      // @ts-expect-error missing param
      expect(() => get({
        throwErrors: true
      })).toThrow(errorMessageTemplateFirstArgumentMissing('path'));
    });

    it('throws when path is null, and throwErrors: true', () => {
      expect(() => get(null, {
        throwErrors: true
      })).toThrow(errorMessageTemplateFirstArgumentMissing('path'));
    });

    it('throws when path is undefined, and throwErrors: true', () => {
      expect(() => get(undefined, {
        throwErrors: true
      })).toThrow(errorMessageTemplateFirstArgumentMissing('path'));
    });

  }); // describe throwErrors

}); // describe get
