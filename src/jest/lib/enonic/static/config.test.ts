import type {
  ByteSource,
  ResourceKey,
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
import { mockEtagService } from '../../../mocks/etagService';
import {
  mockGetResource,
  mockIoService
} from '../../../mocks/ioService';


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
    const resources = {
      '/lib/enonic/static/config.json': {
        bytes: configJson,
        exists: true,
      },
    };
    jest.resetModules();
    // @ts-ignore
    globalThis.__.newBean = (bean: string) => {
      if (bean === 'lib.enonic.libStatic.AppHelper') {
        return {
          isDevMode: () => false
        };
      }
      if (bean === 'lib.enonic.libStatic.etag.EtagService') {
        return mockEtagService({ resources });
      }
      if (bean === 'lib.enonic.libStatic.IoService') {
        return mockIoService({ resources });
      }
      throw new Error(`Unmocked bean:${bean}!`);
    }
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
    const configJson = 'not json';
    const resources = {
      '/lib/enonic/static/config.json': {
        bytes: configJson,
        exists: true,
      },
    };
    jest.resetModules();
    // @ts-ignore
    globalThis.__.newBean = (bean: string) => {
      if (bean === 'lib.enonic.libStatic.AppHelper') {
        return {
          isDevMode: () => false
        };
      }
      if (bean === 'lib.enonic.libStatic.etag.EtagService') {
        return mockEtagService({ resources });
      }
      if (bean === 'lib.enonic.libStatic.IoService') {
        return mockIoService({ resources });
      }
      throw new Error(`Unmocked bean:${bean}!`);
    }
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
    const resources1 = {
      '/lib/enonic/static/config.json': {
        bytes: CONFIG_JSON_DEFAULT,
        exists: true,
      },
    };
    const resources2 = {
      '/lib/enonic/static/config.json': {
        bytes: CONFIG_JSON_CUSTOM,
        exists: true,
      },
    };
    // @ts-ignore
    globalThis.__.newBean = (bean: string) => {
      if (bean === 'lib.enonic.libStatic.AppHelper') {
        return {
          isDevMode: () => false
        };
      }
      if (bean === 'lib.enonic.libStatic.etag.EtagService') {
        return mockEtagService({ resources: resources1 });
      }
      if (bean === 'lib.enonic.libStatic.IoService') {
        // return mockIoService({ resources });
        return {
          getMimeType: (name: string|ResourceKey) => {
            const mimeType = resources1[name as string]?.mimeType;
            if (mimeType) {
              return mimeType;
            }
            log.debug(`getMimeType: Unmocked name:${name}!`);
            return 'application/octet-stream';
          },
          getResource: jest.fn()
            .mockImplementationOnce(mockGetResource({ resources: resources1 }))
            .mockImplementationOnce(mockGetResource({ resources: resources1 }))
            .mockImplementationOnce(mockGetResource({ resources: resources2 }))
            .mockImplementationOnce(mockGetResource({ resources: resources2 }))
          , // getResource
          readText: (_stream: ByteSource) => {
            return _stream as unknown as string;
          }
        }
      }
      throw new Error(`Unmocked bean:${bean}!`);
    }
    jest.resetModules();
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
    const resources1 = {
      '/lib/enonic/static/config.json': {
        bytes: CONFIG_JSON_DEFAULT,
        exists: true,
      },
    };
    const resources2 = {
      '/lib/enonic/static/config.json': {
        bytes: CONFIG_JSON_CUSTOM,
        exists: true,
      },
    };
    jest.resetModules();
    // @ts-ignore
    globalThis.__.newBean = (bean: string) => {
      if (bean === 'lib.enonic.libStatic.AppHelper') {
        return {
          isDevMode: () => true
        };
      }
      if (bean === 'lib.enonic.libStatic.etag.EtagService') {
        return mockEtagService({ resources: resources1 });
      }
      if (bean === 'lib.enonic.libStatic.IoService') {
        return {
          getMimeType: (name: string|ResourceKey) => {
            const mimeType = resources1[name as string]?.mimeType;
            if (mimeType) {
              return mimeType;
            }
            log.debug(`getMimeType: Unmocked name:${name}!`);
            return 'application/octet-stream';
          },
          getResource: jest.fn()
            .mockImplementationOnce(mockGetResource({ resources: resources1 }))
            .mockImplementationOnce(mockGetResource({ resources: resources1 }))
            .mockImplementationOnce(mockGetResource({ resources: resources2 }))
            .mockImplementationOnce(mockGetResource({ resources: resources2 }))
          , // getResource
          readText: (_stream: ByteSource) => {
            return _stream as unknown as string;
          }
        }
      }
      throw new Error(`Unmocked bean:${bean}!`);
    }
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
