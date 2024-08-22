import type { CacheControlResolver } from '/lib/enonic/static/types';

import {
  describe,
  expect,
  test as it
} from '@jest/globals';
import {getImmuteableHeaders} from '../../../main/resources/lib/enonic/static/response/headers/getImmuteableHeaders';


const getCacheControl: CacheControlResolver = (path, _resource, contentType) => {
  if (path === 'path') {
    return 'path';
  }
  if (contentType === 'contentType') {
    return 'contentType';
  }
  return 'resource';
}


describe('getImmuteableHeaders', () => {
  it('no params', () => {
    expect(getImmuteableHeaders()).toEqual({
      'cache-control': 'public, max-age=31536000, immutable'
    });
  });

  describe('getCacheControl', () => {
    it('path', () => {
      expect(getImmuteableHeaders({
        getCacheControl,
        path: 'path'
      })).toEqual({
        'cache-control': 'path'
      });
    });

    it('contentType', () => {
      expect(getImmuteableHeaders({
        getCacheControl,
        contentType: 'contentType'
      })).toEqual({
        'cache-control': 'contentType'
      });
    });

    it('contentType', () => {
      expect(getImmuteableHeaders({
        getCacheControl,
      })).toEqual({
        'cache-control': 'resource'
      });
    });
  }); // getCacheControl
}); // getImmuteableHeaders
