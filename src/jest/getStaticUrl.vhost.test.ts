import type { serviceUrl } from '/lib/xp/portal';
import type { VirtualHost } from '@enonic-types/lib-vhost';
import type { Request } from '/lib/enonic/static/types';

import {
  beforeAll,
  describe,
  expect,
  jest,
  test as it
} from '@jest/globals';
import { mockLibXpVhost } from './mockLibXpVhost';

// const APP_NAME_DASHED = app.name.replace(/\./g, '-');

// const BASEURL_ADMIN_TOOL = `/admin/tool/${app.name}/sample`;
// const BASEURL_ADMIN_WIDGET_CONTEXTPANEL = `/admin/site/admin/${APP_NAME_DASHED}/draft`;
// const BASEURL_ADMIN_WIDGET_MENUITEM = BASEURL_ADMIN_WIDGET_CONTEXTPANEL;
// const BASEURL_SITE_PAGE = `/admin/site/inline/${APP_NAME_DASHED}/draft/sitename`;
// const BASEURL_ADMIN_WIDGET_DASHBOARD = '/admin/tool';
const BASEURL_WEBAPP = `/webapp/${app.name}`;
const BASEURL = BASEURL_WEBAPP;

const VHOSTS: VirtualHost[] = [
  {
    "name": "a",
    "source": "/admin",
    "target": "/admin",
    "host": "localhost",
    "idProviderKeys": []
  },
  {
      "name": "s",
      "source": "/files",
      "target": `/_/service/${app.name}/static`,
      "host": "localhost",
      "idProviderKeys": []
  },
  {
    "name": "d",
    "source": "/duplicateMappingFiles",
    "target": `/_/service/${app.name}/static`,
    "host": "localhost",
    "idProviderKeys": []
  },
  {
      "name": "w",
      "source": "/w",
      "target": `/webapp/${app.name}`,
      "host": "localhost",
      "idProviderKeys": []
  }
];

const WEBAPP_REQUEST = {
  // "method": "GET",
  scheme: 'http',
  host: 'localhost',
  port: 8080,
  // "path": "/w",
  // "rawPath": BASEURL_WEBAPP,
  // "url": "http://localhost:8080/w",
  // "remoteAddress": "127.0.0.1",
  // "mode": "live",
  // "webSocket": false,
  // "repositoryId": "com.enonic.cms.default",
  // "branch": "draft",
  // "contextPath": BASEURL_WEBAPP,
  // "params": {},
  // "headers": {
  //   "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  //   "Accept-Encoding": "gzip, deflate, br, zstd",
  //   "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8,la;q=0.7",
  //   "Cache-Control": "max-age=0",
  //   "Connection": "keep-alive",
  //   "Host": "localhost:8080",
  //   "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
  // },
  // "pathParams": {}
} as Request;

beforeAll((done) => {
  jest.mock('/lib/xp/portal', () => ({
    serviceUrl: jest.fn<typeof serviceUrl>(({
      service,
      params,
    }) => {
      if (params) {
        return `${BASEURL}/_/service/${app.name}/${service}?string=string&number=0&boolean=true&array=two&array=three&array=one`;
      }
      return `${BASEURL}/_/service/${app.name}/${service}`;
    })
  }), { virtual: true });
  done();
});

mockLibXpVhost({
  enabled: true,
  vhosts: VHOSTS
});

describe('getStaticUrl', () => {

  describe('vhost enabled', () => {


    it.skip(`handles type=server`, () => {
      import('../main/resources/lib/enonic/static').then(({ getStaticUrl }) => {
        expect(getStaticUrl({
          relResourcePath: 'assets/200.css',
          // request: WEBAPP_REQUEST,
          // type: 'server'
        })).toEqual('/files/assets/200-1234567890abcdef.css');
      });
    });

    it.skip(`handles type=absolute`, () => {
      import('../main/resources/lib/enonic/static').then(({ getStaticUrl }) => {
        expect(getStaticUrl({
          relResourcePath: 'assets/200.css',
          // request: WEBAPP_REQUEST,
          type: 'absolute'
        })).toEqual('http://localhost:8080/files/assets/200-1234567890abcdef.css');
      });
    });

    it.skip(`handles type=absolute with port 80`, () => {
      import('../main/resources/lib/enonic/static').then(({ getStaticUrl }) => {
        expect(getStaticUrl({
          relResourcePath: 'assets/200.css',
          // request: {
          //   ...WEBAPP_REQUEST,
          //   port: 80
          // },
          type: 'absolute'
        })).toEqual('http://localhost/files/assets/200-1234567890abcdef.css');
      });
    });

    it.skip(`handles type=absolute with scheme https and port 443`, () => {
      import('../main/resources/lib/enonic/static').then(({ getStaticUrl }) => {
        expect(getStaticUrl({
          relResourcePath: 'assets/200.css',
          // request: {
          //   ...WEBAPP_REQUEST,
          //   port: 443,
          //   scheme: 'https'
          // },
          type: 'absolute'
        })).toEqual('https://localhost/files/assets/200-1234567890abcdef.css');
      });
    });
  });

  it.skip(`throws if type=absolute and request is missing`, () => {
    import('../main/resources/lib/enonic/static').then(({ getStaticUrl }) => {
      expect(() => getStaticUrl({
        relResourcePath: 'assets/200.css',
        // request: undefined,
        type: 'absolute'
      })).toThrowError(`Can't handle type absolute without request!`);
    });
  });

});
