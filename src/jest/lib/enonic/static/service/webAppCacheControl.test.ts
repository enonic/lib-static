import {
  describe,
  expect,
  test as it
} from '@jest/globals';
import {
  CONTENT_TYPE,
  RESPONSE_CACHE_CONTROL,
} from '../../../../../main/resources/lib/enonic/static/constants';
import {webAppCacheControl} from '../../../../../main/resources/lib/enonic/static';


describe('webAppCacheControl', () => {
    [{
      cacheControl: RESPONSE_CACHE_CONTROL.PREVENT,
      cacheControlStrategy: 'prevent',
      contentType: CONTENT_TYPE.HTML,
      // path: '/index.html',
    },{
      cacheControl: RESPONSE_CACHE_CONTROL.SAFE,
      cacheControlStrategy: 'safe',
      // contentType: CONTENT_TYPE.ICO,
      path: '/favicon.ico',
    },{
      cacheControl: RESPONSE_CACHE_CONTROL.SAFE,
      cacheControlStrategy: 'safe',
      // contentType: CONTENT_TYPE.JSON,
      path: '/manifest.json',
    },{
      cacheControl: RESPONSE_CACHE_CONTROL.CRAWLER,
      cacheControlStrategy: 'crawler',
      // contentType: CONTENT_TYPE.TEXT,
      path: '/robots.txt',
    },{
      cacheControl: RESPONSE_CACHE_CONTROL.CRAWLER,
      cacheControlStrategy: 'crawler',
      // contentType: CONTENT_TYPE.XML,
      path: '/sitemap.xml',
    },{
      cacheControl: RESPONSE_CACHE_CONTROL.PREVENT,
      cacheControlStrategy: 'prevent',
      // contentType: CONTENT_TYPE.XML,
      path: '/BingSiteAuth.xml',
    },{
      cacheControl: RESPONSE_CACHE_CONTROL.SAFE,
      cacheControlStrategy: 'safe',
      // contentType: CONTENT_TYPE.WEBMANIFEST,
      path: '/whatever.webmanifest',
    },{
      cacheControl: RESPONSE_CACHE_CONTROL.EDGE,
      cacheControlStrategy: 'edge',
      // contentType: CONTENT_TYPE.EXE,
      path: '/.well-known/whatever',
    },{
      cacheControl: RESPONSE_CACHE_CONTROL.IMMUTABLE,
      cacheControlStrategy: 'immutable',
      // contentType: CONTENT_TYPE.EXE,
      // path: '/file.exe',
    }
  ].forEach(({
      cacheControl,
      cacheControlStrategy,
      contentType,
      path
    }) => {
      it(`should use cacheControlStrategy "${cacheControlStrategy}" when contentType is "${contentType}" and path is "${path}"`, () => {
        expect(webAppCacheControl({ contentType, path })).toBe(cacheControl);
      }); // it
    });
}); // describe('
