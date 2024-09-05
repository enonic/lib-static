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
import { mockEtagService } from '../../mocks/etagService';
import { mockIoService } from '../../mocks/ioService';


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
    mockLibRouter();
    import('../../../main/resources/services/static/static').then(({ all }) => {
      const request = buildRequest({});
      expect(all(request)).toEqual({
        status: 404,
      });
    }); // import
  }); // it

}); // describe
