import {
  describe,
  expect,
  // jest,
  test as it
} from '@jest/globals';
import {
  STATIC_ASSETS_INDEX_HTML,
} from '../../../testdata';

describe('io', () => {
  describe('getMimeType', () => {
    it('should return the mime type of a file', () => {
      import('../../../../main/resources/lib/enonic/static/io').then(({getMimeType}) => {
        expect(getMimeType('/static/assets/index.html')).toBe('text/html');
        expect(getMimeType('/static/assets/200.css')).toBe('text/css');
        expect(getMimeType('unknown')).toBe('application/octet-stream');
      }); // import
    }); // it
  }); // describe getMimeType

  describe('getResource', () => {
    it('should return a resource', () => {
      import('../../../../main/resources/lib/enonic/static/io').then(({getResource}) => {
        const resource = getResource('/static/assets/index.html');
        expect(resource.exists()).toBe(true);
        expect(resource.getSize()).toBe(STATIC_ASSETS_INDEX_HTML.length);
        expect(resource.readString()).toBe(STATIC_ASSETS_INDEX_HTML);
        expect(resource.getStream()).toBe(STATIC_ASSETS_INDEX_HTML);
      }); // import
    }); // it
  }); // describe getResource

  // describe('readText', () => {
  //   it('should read text from a byte source', () => {
  //     import('../../../../main/resources/lib/enonic/static/io').then(({
  //       getResource,
  //       readText,
  //     }) => {
  //       const resource = getResource('/static/assets/index.html');
  //       const stream = resource.getStream();
  //       expect(readText(stream)).toBe(STATIC_ASSETS_INDEX_HTML);
  //     }); // import
  //   }); // it
  // }); // describe readText
}); // describe io
