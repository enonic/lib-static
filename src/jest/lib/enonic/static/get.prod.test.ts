import {
  describe,
  expect,
  test as it
} from '@jest/globals';
import {
  errorMessageTemplateFirstArgumentMissing
} from '../../../../main/resources/lib/enonic/static/options/verifyAndTrimPathOrRoot';
import { get } from '../../../../main/resources/lib/enonic/static'
import {
  internalServerErrorResponse,
  okResponse,
  silenceLogError
} from '../../../expectations';
import { STATIC_ASSETS_200_CSS } from '../../../testdata';


describe('get', () => {

  describe('Successful responses', () => {
    it('returns 200 OK when resource is found', () => {
      expect(get('/static/assets/200.css')).toEqual(okResponse({
        body: STATIC_ASSETS_200_CSS,
        contentType: 'text/css',
        headers: {
          'cache-control': 'public, max-age=31536000, immutable',
          // TODO: Seems weird to return both etag and immuteable!!!
          etag: '"1234567890abcdef"'
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
      // NOTE: No body or contentType in prod mode
      expect(get('')).toEqual({ status: 400 });
    });

    it('returns bad request when path is /', () => {
      import('../../../../main/resources/lib/enonic/static').then(({ get }) => {
        // NOTE: No body or contentType in prod mode
        expect(get('/')).toEqual({ status: 400 });
      });
    });

    it('returns not found response when resource is not found', () => {
      const root = 'static';
      const path = `${root}/assets/404.css`;
      // NOTE: No body or contentType in prod mode
      expect(get(path)).toEqual({ status: 404 });
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
