import {
  describe,
  expect,
  test as it
} from '@jest/globals';
import {mockJava} from './mockJava';

describe('getStaticPath in dev mode', () => {
  it(`does it's thing in dev mode`, () => {
    mockJava({
      devMode: true,
      resources: {
        '/static/assets/200.css': {
          exists: true,
          mimeType: 'text/css',
        }
      }
    });
    import('../main/resources/lib/enonic/static').then(({ getStaticPath }) => {
      expect(getStaticPath({ relResourcePath: 'assets/200.css' })).toEqual('assets/200.css');
      expect(getStaticPath({ relResourcePath: 'assets/200.css/' })).toEqual('assets/200.css');
      expect(getStaticPath({ relResourcePath: '/assets/200.css' })).toEqual('/assets/200.css');
      expect(getStaticPath({ relResourcePath: '/assets/200.css/' })).toEqual('/assets/200.css');
    });
  });
});
