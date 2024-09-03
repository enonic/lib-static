import type {
  ByteSource,
  getResource as getResourceValue
} from '@enonic-types/lib-io';
// import type { Router } from '@item-enonic-types/lib-router';
import type {
  Config,
  Response,
} from '/lib/enonic/static/types';

import {
  describe,
  expect,
  jest,
  test as it
} from '@jest/globals';
import {
  buildRequest,
} from '../../expectations';
import { Resource } from '../../Resource';


const MOCKED_RESPONSE: Response = {
  body: 'mockedResponse',
  contentType: 'text/plain; charset=utf-8',
  status: 200,
};


function mockLibRouter() {
  jest.mock('/lib/router', () => {
    return {
      __esModule: true,
      default: jest.fn(() => ({
        dispatch: jest.fn().mockReturnValue(MOCKED_RESPONSE),
        get: jest.fn().mockReturnValue(MOCKED_RESPONSE),
      }))
    };
  }, { virtual: true });
}


describe('services/static', () => {
  it('returns response when config.json enabled is true', () => {
    const config: Partial<Config> = {
      enabled: true,
    };
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
        return {
          exists: () => true,
        } as Resource;
      }),
      readText: (_stream: ByteSource) => {
        return configJson;
      },
    }), { virtual: true });
    mockLibRouter();
    import('../../../main/resources/services/static/static').then(({ all }) => {
      const request = buildRequest({});
      expect(all(request)).toEqual(MOCKED_RESPONSE);
    }); // import
  }); // it

  it('returns 404 Not found when config.json enabled is false', () => {
    const config: Partial<Config> = {
      enabled: false,
    };
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
        return {
          exists: () => true,
        } as Resource;
      }),
      readText: (_stream: ByteSource) => {
        return configJson;
      },
    }), { virtual: true });
    mockLibRouter();
    import('../../../main/resources/services/static/static').then(({ all }) => {
      const request = buildRequest({});
      expect(all(request)).toEqual({
        status: 404,
      });
    }); // import
  }); // it

}); // describe
