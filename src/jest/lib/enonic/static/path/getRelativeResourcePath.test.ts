import type { Request } from '/lib/enonic/static/types';

import {
  describe,
  expect,
  test as it
} from '@jest/globals';
import {
  ERROR_MESSAGE_REQUEST_RAWPATH_DOES_NOT_STARTWITH_REMOVEPREFIX,
  ERROR_MESSAGE_REQUEST_WITHOUT_RAWPATH,
  getRelativeResourcePath
} from '../../../../../main/resources/lib/enonic/static/path/getRelativeResourcePath';


describe('getRelativeResourcePath', () => {
  it('throws when no options', () => {
    // @ts-expect-error missing param
    expect(() => getRelativeResourcePath()).toThrow(ERROR_MESSAGE_REQUEST_WITHOUT_RAWPATH);
  });

  it('throws when request without rawPath', () => {
    // @ts-expect-error missing param
    expect(() => getRelativeResourcePath({})).toThrow(ERROR_MESSAGE_REQUEST_WITHOUT_RAWPATH);
  });

  it("throws when rawPath doesn't start with contextPath", () => {
    // @ts-expect-error missing param
    expect(() => getRelativeResourcePath({
      rawPath: '/path',
    })).toThrow(ERROR_MESSAGE_REQUEST_RAWPATH_DOES_NOT_STARTWITH_REMOVEPREFIX);
  });

  it('returns trimmed string with contextPath prefix removed', () => {
    const appName = 'com.example.myproject'; // globalThis.app.name
    const contextPath = `/webapp/${appName}`
    expect(getRelativeResourcePath({
      contextPath,
      rawPath: `${contextPath}/assets/filename.ext`,
    } as Request)).toEqual('/assets/filename.ext');
  });

  // TODO: This seems like weird behaviour.
  // NOTE: Changing vhost doesn't affect contextPath nor rawPath (7.14?),
  // so such a request shouldn't be possible in Enonic XP.
  it('returns relative path without starting slash when contextPath is /', () => {
    const contextPath = '/'
    expect(getRelativeResourcePath({
      contextPath,
      rawPath: `${contextPath}/assets/filename.ext`,
    } as Request)).toEqual('assets/filename.ext');
  });

}); // describe getRelativeResourcePath
