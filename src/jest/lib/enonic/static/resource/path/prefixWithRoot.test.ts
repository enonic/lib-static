import {
  describe,
  expect,
  jest,
  test as it
} from '@jest/globals';

describe('prefixWithRoot', () => {
  it('throws when root is an empty string', () => {
    import('../../../../../../main/resources/lib/enonic/static/resource/path/prefixWithRoot').then(({ prefixWithRoot }) => {
      expect(() => prefixWithRoot({
        path: 'static/assets/200.css',
        root: ''
      })).toThrow('prefixWithRoot: root must be a non-empty string! root: ""');
    });
  });

  it('throws when root is just a slash', () => {
    import('../../../../../../main/resources/lib/enonic/static/resource/path/prefixWithRoot').then(({ prefixWithRoot }) => {
      expect(() => prefixWithRoot({
        path: 'static/assets/200.css',
        root: '/'
      })).toThrow('prefixWithRoot: root must be a non-empty string! root: "/"');
    });
  });

});
