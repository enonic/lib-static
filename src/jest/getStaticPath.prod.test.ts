import {
  describe,
  expect,
  test as it
} from '@jest/globals';
import {mockJava} from './mockJava';


describe('getStaticPath in prod mode', () => {
  it(`does it's thing in prod mode`, () => {
    mockJava({
      devMode: false,
      resources: {
        '/static/assets/200.css': {
          exists: true,
          etag: '1234567890abcdef',
          mimeType: 'text/css',
        }
      }
    });
    import('../main/resources/lib/enonic/static').then(({ getStaticPath }) => {
      expect(getStaticPath({ relResourcePath: 'assets/200.css' })).toEqual('assets/200-1234567890abcdef.css');
      expect(getStaticPath({ relResourcePath: 'assets/200.css/' })).toEqual('assets/200-1234567890abcdef.css');
      expect(getStaticPath({ relResourcePath: '/assets/200.css' })).toEqual('/assets/200-1234567890abcdef.css');
      expect(getStaticPath({ relResourcePath: '/assets/200.css/' })).toEqual('/assets/200-1234567890abcdef.css');
    });
  });
});
