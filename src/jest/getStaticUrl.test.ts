import type {
  assetUrl,
  // serviceUrl
} from '/lib/xp/portal';

import {
  beforeAll,
  describe,
  expect,
  jest,
  test as it
} from '@jest/globals';

// const APP_NAME_DASHED = app.name.replace(/\./g, '-');

// const BASEURL_ADMIN_TOOL = `/admin/tool/${app.name}/sample`;
// const BASEURL_ADMIN_WIDGET_CONTEXTPANEL = `/admin/site/admin/${APP_NAME_DASHED}/draft`;
// const BASEURL_ADMIN_WIDGET_MENUITEM = BASEURL_ADMIN_WIDGET_CONTEXTPANEL;
// const BASEURL_SITE_PAGE = `/admin/site/inline/${APP_NAME_DASHED}/draft/sitename`;
// const BASEURL_ADMIN_WIDGET_DASHBOARD = '/admin/tool';
const BASEURL_WEBAPP = `/webapp/${app.name}`;
const BASEURL = BASEURL_WEBAPP;

const FINGERPRINT = '0000019150605440';


beforeAll((done) => {
  jest.mock('/lib/xp/portal', () => ({
    assetUrl: jest.fn<typeof assetUrl>(({
      params,
      // path
    }) => {
      if (params) {
        return `${BASEURL}/_/asset/${app.name}:${FINGERPRINT}/?string=string&number=0&boolean=true&array=two&array=three&array=one`;
      }
      return `${BASEURL}/_/asset/${app.name}:${FINGERPRINT}`;
      // /webapp/com.acme.example.tsup/_/asset/com.acme.example.tsup:0000019150605440
      // /webapp/com.acme.example.tsup/_/asset/com.acme.example.tsup:0000019150605440/?string=string&number=0&boolean=true&array=two&array=three&array=one
      // /webapp/com.acme.example.tsup/_/asset/com.acme.example.tsup:000001915063ee20/folder/filename.svg
      // /webapp/com.acme.example.tsup/_/asset/com.acme.example.tsup:0000019150637120/folder/filename.svg?string=string&number=0&boolean=true&array=two&array=three&array=one

    }),
  //   serviceUrl: jest.fn<typeof serviceUrl>(({
  //     service,
  //     params,
  //   }) => {
  //     if (params) {
  //       return `${BASEURL}/_/service/${app.name}/${service}?string=string&number=0&boolean=true&array=two&array=three&array=one`;
  //     }
  //     return `${BASEURL}/_/service/${app.name}/${service}`;
  //   }),
  }), { virtual: true });
  done();
});



describe('getStaticUrl', () => {

  it(`does it's thing`, () => {
    import('../main/resources/lib/enonic/static').then(({ getStaticUrl }) => {
      expect(getStaticUrl({
        path: 'assets/200.css'
      })).toEqual('/webapp/com.example.myproject/_/service/com.example.myproject/static/assets/200.css');
    });
  });

  it(`handles url query params`, () => {
    import('../main/resources/lib/enonic/static').then(({ getStaticUrl }) => {
      expect(getStaticUrl({
        params: {
          array: [ 'one', 'two', 'three' ],
          boolean: true,
          number: 0,
          string: 'string',
        },
        path: 'assets/200.css'
      })).toEqual('/webapp/com.example.myproject/_/service/com.example.myproject/static/assets/200.css?string=string&number=0&boolean=true&array=two&array=three&array=one');
    });
  });

  it(`handles service name`, () => {
    import('../main/resources/lib/enonic/static').then(({ getStaticUrl }) => {
      expect(getStaticUrl({
        path: 'assets/200.css',
        service: 'mycustomstaticservice'
      })).toEqual('/webapp/com.example.myproject/_/service/com.example.myproject/mycustomstaticservice/assets/200.css');
    });
  });

});
