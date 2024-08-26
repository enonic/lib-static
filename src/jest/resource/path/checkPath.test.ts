import {
  describe,
  expect,
  jest,
  test as it
} from '@jest/globals';

describe('checkPath', () => {
  it("returns void when path doesn't contain an error", () => {
    import('../../../main/resources/lib/enonic/static/resource/path/checkPath').then(({ checkPath }) => {
      expect(checkPath({
        absResourcePathWithoutTrailingSlash: '/static/assets/200.css'
      })).toBeUndefined();
    });
  });

  it("returns bad request when path contains illegal char", () => {
    import('../../../main/resources/lib/enonic/static/resource/path/checkPath').then(({ checkPath }) => {
      expect(checkPath({
        absResourcePathWithoutTrailingSlash: '<'
      })).toEqual({
        status: 400
      });
    });
  });

  it("returns bad request with body in dev mode", () => {
    jest.resetModules();
    // @ts-ignore
    globalThis.__.newBean = (bean: string) => {
      if (bean === 'lib.enonic.libStatic.AppHelper') {
        return {
          isDevMode: () => true
        };
      }
      throw new Error(`Unmocked bean:${bean}!`);
    };
    import('../../../main/resources/lib/enonic/static/resource/path/checkPath').then(({ checkPath }) => {
      expect(checkPath({
        absResourcePathWithoutTrailingSlash: '<'
      })).toEqual({
        body: 'can\'t contain \'..\' or any of these characters: \\ | ? * < > \' " ` ´',
        contentType: 'text/plain; charset=utf-8',
        status: 400
      });
    });
  });
});
