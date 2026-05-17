import {
  describe,
  expect,
  test as it
} from '@jest/globals';
import {prefixWithRoot} from '../../../../../../main/resources/lib/enonic/static/resource/path/prefixWithRoot';


describe('prefixWithRoot', () => {
  it('joins root and absolute path', () => {
    expect(prefixWithRoot({root: '/static', path: '/styles.css'})).toEqual('/static/styles.css');
  });

  it('joins root and relative path (no leading slash)', () => {
    expect(prefixWithRoot({root: '/static', path: 'styles.css'})).toEqual('/static/styles.css');
  });

  it('treats root without leading slash the same as with one', () => {
    expect(prefixWithRoot({root: 'static', path: '/styles.css'})).toEqual('/static/styles.css');
    expect(prefixWithRoot({root: 'static', path: 'styles.css'})).toEqual('/static/styles.css');
  });

  it('strips a single trailing slash from the result', () => {
    expect(prefixWithRoot({root: '/static', path: '/styles.css/'})).toEqual('/static/styles.css');
  });

  it('throws when root is empty', () => {
    expect(() => prefixWithRoot({root: '', path: '/styles.css'})).toThrow(/root must be a non-empty string/);
  });

  it('throws when root is only slashes', () => {
    expect(() => prefixWithRoot({root: '///', path: '/styles.css'})).toThrow(/root must be a non-empty string/);
  });
});
