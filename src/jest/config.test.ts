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

const CONFIG_JSON_DEFAULT = `{
  "cacheStrategy": "etag",
  "etagProcessing": "auto",
  "etagCacheControlHeader": "max-age=3600",
  "immutableCacheControlHeader": "public, max-age=31536000, immutable",
  "root": "static"
}`;

const CONFIG_JSON_CUSTOM = `{
  "cacheStrategy": "immutable",
  "etagProcessing": "never",
  "etagCacheControlHeader": "no-cache",
  "immutableCacheControlHeader": "public, max-age=2147483647, immutable",
  "root": "custom/root"
}`;

describe('getConfig', () => {
  it('returns hardcoded default when no config.json', () => {
    jest.resetModules();
    jest.mock('/lib/xp/io', () => ({
      getResource: jest.fn<typeof getResourceValue>((key) => {
        if (key === '/lib/enonic/static/config.json') {
          return new Resource({
            bytes: undefined,
            exists: false,
            key: key.toString(),
            size: 0,
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
        return undefined;
      },
    }), { virtual: true });
    import('../main/resources/lib/enonic/static/config').then(({ getConfig }) => {
      expect(getConfig()).toEqual({
        cacheStrategy: 'etag',
        etagProcessing: 'auto',
        etagCacheControlHeader: 'max-age=3600',
        immutableCacheControlHeader: 'public, max-age=31536000, immutable',
        root: 'static'
      }); // expect
    }); // import
  }); // it

  it('getConfiguredCacheStrategy', () => {
    import('../main/resources/lib/enonic/static/config').then(({ getConfiguredCacheStrategy }) => {
      expect(getConfiguredCacheStrategy()).toBe('etag');
    });
  });

  it('getConfiguredEtagCacheControlHeader', () => {
    import('../main/resources/lib/enonic/static/config').then(({ getConfiguredEtagCacheControlHeader }) => {
      expect(getConfiguredEtagCacheControlHeader()).toBe('max-age=3600');
    });
  });

  it('getConfiguredEtagProcessing', () => {
    import('../main/resources/lib/enonic/static/config').then(({ getConfiguredEtagProcessing }) => {
      expect(getConfiguredEtagProcessing()).toBe('auto');
    });
  });

  it('getConfiguredImmutableCacheControlHeader', () => {
    import('../main/resources/lib/enonic/static/config').then(({ getConfiguredImmutableCacheControlHeader }) => {
      expect(getConfiguredImmutableCacheControlHeader()).toBe('public, max-age=31536000, immutable');
    });
  });

  it('getRoot', () => {
    import('../main/resources/lib/enonic/static/config').then(({ getRoot }) => {
      expect(getRoot()).toBe('static');
    });
  });

  it('returns correct settings based on config.json', () => {
    const CONFIG_JSON = `{
      "cacheStrategy": "immutable",
      "etagProcessing": "never",
      "etagCacheControlHeader": "no-cache",
      "immutableCacheControlHeader": "public, max-age=2147483647, immutable",
      "root": "custom/root"
    }`;
    jest.resetModules();
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

  it("returns defaults when config.json doesn't parse", () => {
    const CONFIG_JSON = 'not json';
    jest.resetModules();
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
        cacheStrategy: 'etag',
        etagProcessing: 'auto',
        etagCacheControlHeader: 'max-age=3600',
        immutableCacheControlHeader: 'public, max-age=31536000, immutable',
        root: 'static'
      }); // expect
    }); // import
  }); // it

  it("caches in production mode", () => {
    // @ts-ignore
    globalThis.__.newBean = (bean: string) => {
      if (bean === 'lib.enonic.libStatic.AppHelper') {
        return {
          isDevMode: () => false
        };
      }
      throw new Error(`Unmocked bean:${bean}!`);
    }
    jest.resetModules();
    jest.mock('/lib/xp/io', () => ({
      getResource: jest.fn<typeof getResourceValue>()
      .mockReturnValueOnce(new Resource({
        bytes: CONFIG_JSON_DEFAULT,
        exists: true,
        key: '/lib/enonic/static/config.json',
        size: CONFIG_JSON_DEFAULT.length,
        timestamp: Date.now()
      }))
      .mockReturnValueOnce(({
        exists: () => false,
      } as Resource))
      .mockReturnValueOnce(new Resource({
        bytes: CONFIG_JSON_CUSTOM,
        exists: true,
        key: '/lib/enonic/static/config.json',
        size: CONFIG_JSON_CUSTOM.length,
        timestamp: Date.now()
      }))
      .mockReturnValueOnce(({
        exists: () => false,
      } as Resource)),
      readText: jest.fn()
        .mockReturnValueOnce(CONFIG_JSON_DEFAULT)
        .mockReturnValueOnce(CONFIG_JSON_CUSTOM),
    }), { virtual: true });
    import('../main/resources/lib/enonic/static/config').then(({ getConfig }) => {
      const res = {
        cacheStrategy: 'etag',
        etagProcessing: 'auto',
        etagCacheControlHeader: 'max-age=3600',
        immutableCacheControlHeader: 'public, max-age=31536000, immutable',
        root: 'static'
      };
      expect(getConfig()).toEqual(res);
      expect(getConfig()).toEqual(res);
    }); // import
  }); // it

  it("doesn't cache in dev mode", () => {
    //@ts-ignore
    globalThis.__.newBean = (bean: string) => {
      if (bean === 'lib.enonic.libStatic.AppHelper') {
        return {
          isDevMode: () => true
        };
      }
      throw new Error(`Unmocked bean:${bean}!`);
    }
    jest.resetModules();
    jest.mock('/lib/xp/io', () => ({
      getResource: jest.fn<typeof getResourceValue>()
      .mockReturnValueOnce(new Resource({
        bytes: CONFIG_JSON_DEFAULT,
        exists: true,
        key: '/lib/enonic/static/config.json',
        size: CONFIG_JSON_DEFAULT.length,
        timestamp: Date.now()
      }))
      .mockReturnValueOnce(({
        exists: () => false,
      } as Resource))
      .mockReturnValueOnce(new Resource({
        bytes: CONFIG_JSON_CUSTOM,
        exists: true,
        key: '/lib/enonic/static/config.json',
        size: CONFIG_JSON_CUSTOM.length,
        timestamp: Date.now()
      }))
      .mockReturnValueOnce(({
        exists: () => false,
      } as Resource)),
      readText: jest.fn()
        .mockReturnValueOnce(CONFIG_JSON_DEFAULT)
        .mockReturnValueOnce(CONFIG_JSON_CUSTOM),
    }), { virtual: true });
    import('../main/resources/lib/enonic/static/config').then(({ getConfig }) => {
      expect(getConfig()).toEqual({
        cacheStrategy: 'etag',
        etagProcessing: 'auto',
        etagCacheControlHeader: 'max-age=3600',
        immutableCacheControlHeader: 'public, max-age=31536000, immutable',
        root: 'static'
      }); // expect
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
