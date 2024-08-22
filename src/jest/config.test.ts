import type {
  ByteSource,
  getResource as getResourceValue
} from '@enonic-types/lib-io';

import {
  // beforeAll,
  describe,
  expect,
  jest,
  test as it
} from '@jest/globals';
import { Resource } from './Resource';

// beforeAll((done) => {

//   done();
// });

describe('getConfig', () => {
  // it('returns hardcoded default when no config.json', () => {
  //   jest.mock('/lib/xp/io', () => ({
  //     getResource: jest.fn<typeof getResourceValue>((key) => {
  //       if (key === '/lib/enonic/static/config.json') {
  //         return new Resource({
  //           bytes: undefined,
  //           exists: false,
  //           key: key.toString(),
  //           size: 0,
  //           timestamp: Date.now()
  //         });
  //       }
  //       // console.debug('getResource', key);
  //       return {
  //         exists: () => false,
  //       } as Resource;
  //     }),
  //     readText: (_stream: ByteSource) => {
  //       // console.debug('readText');
  //       return undefined;
  //     },
  //   }), { virtual: true });
  //   import('../main/resources/lib/enonic/static/config').then(({ getConfig }) => {
  //     expect(getConfig()).toEqual({
  //       cacheStrategy: 'etag',
  //       etagProcessing: 'auto',
  //       etagCacheControlHeader: 'max-age=3600',
  //       immutableCacheControlHeader: 'public, max-age=31536000, immutable',
  //       root: 'static'
  //     }); // expect
  //   }); // import
  // }); // it

  it('returns correct settings based on config.json', () => {
    const CONFIG_JSON = `{
      "cacheStrategy": "immutable",
      "etagProcessing": "never",
      "etagCacheControlHeader": "no-cache",
      "immutableCacheControlHeader": "public, max-age=2147483647, immutable",
      "root": "custom/root"
    }`;
    jest.mock('/lib/xp/io', () => ({
      getResource: jest.fn<typeof getResourceValue>((key) => {
        if (key === '/lib/enonic/static/config.json') {
          return new Resource({
            bytes: CONFIG_JSON,
            exists: true,
            key: key.toString(),
            size: CONFIG_JSON.length,
            timestamp: Date.now()
          });
        }
        // console.debug('getResource', key);
        return {
          exists: () => false,
        } as Resource;
      }),
      readText: (_stream: ByteSource) => {
        // console.debug('readText');
        return CONFIG_JSON;
      },
    }), { virtual: true });
    import('../main/resources/lib/enonic/static/config').then(({ getConfig }) => {
      expect(getConfig()).toEqual({
        cacheStrategy: 'immutable',
        etagProcessing: 'never',
        etagCacheControlHeader: 'no-cache',
        // Approx 68 years
        immutableCacheControlHeader: 'public, max-age=2147483647, immutable',
        root: 'custom/root'
      }); // expect
    }); // import
  }); // it
}); // describe
