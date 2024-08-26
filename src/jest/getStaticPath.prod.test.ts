import {
  describe,
  expect,
  test as it
} from '@jest/globals';
import { getStaticPath } from '../main/resources/lib/enonic/static';


describe('getStaticPath in prod mode', () => {
  it(`does it's thing in prod mode`, () => {
    expect(getStaticPath({ path: 'assets/200.css' })).toEqual('assets/200-1234567890abcdef.css');
    expect(getStaticPath({ path: 'assets/200.css/' })).toEqual('assets/200-1234567890abcdef.css');
    expect(getStaticPath({ path: '/assets/200.css' })).toEqual('/assets/200-1234567890abcdef.css');
    expect(getStaticPath({ path: '/assets/200.css/' })).toEqual('/assets/200-1234567890abcdef.css');
  });
  it(`handles resources without extension`, () => {
    expect(getStaticPath({ path: 'filenameWithoutExt' })).toEqual('filenameWithoutExt-1234567890abcdef');
  });
});
