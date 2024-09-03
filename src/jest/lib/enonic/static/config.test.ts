import type {
  ByteSource,
  getResource as getResourceValue
} from '@enonic-types/lib-io';
import type {
  Config,
} from '/lib/enonic/static/types';

import {
  // beforeAll,
  describe,
  expect,
  jest,
  test as it
} from '@jest/globals';
import { Resource } from '../../../Resource';


// An empty config.json should return defaults
const CONFIG_DEFAULT: Partial<Config> = {};
const CONFIG_JSON_DEFAULT = JSON.stringify(CONFIG_DEFAULT);


const CONFIG_CUSTOM: Config = {
  enabled: false,
  etag: 'off',
  cacheControl: 'public, max-age=2147483647, immutable',
  root: 'custom/root'
};
const CONFIG_JSON_CUSTOM = JSON.stringify(CONFIG_CUSTOM);


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
    import('../../../../main/resources/lib/enonic/static/config').then(({ getConfig }) => {
      expect(getConfig()).toEqual({
        cacheControl: 'public, max-age=10, stale-while-revalidate=50',
        enabled: true,
        etag: 'auto',
        root: 'static'
      }); // expect
    }); // import
  }); // it

  it('getConfiguredEtag', () => {
    import('../../../../main/resources/lib/enonic/static/config').then(({ getConfiguredEtag }) => {
      expect(getConfiguredEtag()).toBe('auto');
    });
  });

  it('getConfiguredCacheControl', () => {
    import('../../../../main/resources/lib/enonic/static/config').then(({ getConfiguredCacheControl }) => {
      expect(getConfiguredCacheControl()).toBe('public, max-age=10, stale-while-revalidate=50');
    });
  });

  it('getRoot', () => {
    import('../../../../main/resources/lib/enonic/static/config').then(({ getRoot }) => {
      expect(getRoot()).toBe('static');
    });
  });

  it('isEnabled', () => {
    import('../../../../main/resources/lib/enonic/static/config').then(({ isEnabled }) => {
      expect(isEnabled()).toBe(true);
    });
  });

  it('returns correct settings based on config.json', () => {
    const config: Config = {
      enabled: true,
      etag: 'off',
      cacheControl: 'public, max-age=2147483647, immutable',
      root: 'custom/root'
    }
    const configJson = JSON.stringify(config);
    jest.resetModules();
    jest.mock('/lib/xp/io', () => ({
      getResource: jest.fn<typeof getResourceValue>((key) => {
        if (key === '/lib/enonic/static/config.json') {
          return new Resource({
            bytes: configJson,
            exists: true,
            key: key.toString(),
            size: configJson.length,
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
        return configJson;
      },
    }), { virtual: true });
    import('../../../../main/resources/lib/enonic/static/config').then(({ getConfig }) => {
      expect(getConfig()).toEqual({
        // Approx 68 years
        cacheControl: 'public, max-age=2147483647, immutable',
        enabled: true,
        etag: 'off',
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
    import('../../../../main/resources/lib/enonic/static/config').then(({ getConfig }) => {
      expect(getConfig()).toEqual({
        cacheControl: 'public, max-age=10, stale-while-revalidate=50',
        enabled: true,
        etag: 'auto',
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
    import('../../../../main/resources/lib/enonic/static/config').then(({ getConfig }) => {
      const res = {
        cacheControl: 'public, max-age=10, stale-while-revalidate=50',
        enabled: true,
        etag: 'auto',
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
    import('../../../../main/resources/lib/enonic/static/config').then(({ getConfig }) => {
      expect(getConfig()).toEqual({
        enabled: true,
        etag: 'auto',
        cacheControl: 'public, max-age=10, stale-while-revalidate=50',
        root: 'static'
      }); // expect
      expect(getConfig()).toEqual({
        // Approx 68 years
        cacheControl: 'public, max-age=2147483647, immutable',
        enabled: false,
        etag: 'off',
        root: 'custom/root'
      }); // expect
    }); // import
  }); // it

}); // describe
