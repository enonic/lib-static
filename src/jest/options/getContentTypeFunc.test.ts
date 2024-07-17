import type {Resource} from '@enonic-types/lib-io';

import {
  // beforeAll,
  describe,
  expect,
  // jest,
  test as it
} from '@jest/globals';
import { getContentTypeFunc } from '../../main/resources/lib/enonic/static/options/getContentTypeFunc'


describe('getContentTypeFunc', () => {
  it('returns a function that only returns undefined, when contentType is false', () => {
    expect(getContentTypeFunc(false)()).toEqual(undefined);
  });

  it('returns IoService.getMimeType', () => {
    // @ts-ignore
    expect(getContentTypeFunc()()).toEqual('application/octet-stream');
    expect(getContentTypeFunc(true)()).toEqual('application/octet-stream');
    expect(getContentTypeFunc(undefined)()).toEqual('application/octet-stream');
  });

  it('returns a function that only returns undefined, when contentType is an empty string', () => {
    expect(getContentTypeFunc('')()).toEqual(undefined);
  });

  it('returns a function that only returns a string, when contentType is a string', () => {
    expect(getContentTypeFunc('whatever')()).toEqual('whatever');
  });

  it('returns a function when contentType is a function', () => {
    const stupidCustomFn = (path?: string, resource?: Resource) => {
      log.debug('stupidCustomFn', {path, resource});
      return null;
    };
    const justFallsbackToIoServiceGetMimeTypeFn = getContentTypeFunc(stupidCustomFn)
    expect(justFallsbackToIoServiceGetMimeTypeFn()).toEqual('application/octet-stream');
    expect(justFallsbackToIoServiceGetMimeTypeFn('/static/assets/200.css')).toEqual('text/css');

    const customFn = (path?: string, resource?: Resource) => {
      log.debug('customFn', {path, resource});
      return 'my/custom/mime-type';
    };
    const rarelyFallsbackToIoServiceGetMimeTypeFn = getContentTypeFunc(customFn)
    expect(rarelyFallsbackToIoServiceGetMimeTypeFn()).toEqual('my/custom/mime-type');
    expect(rarelyFallsbackToIoServiceGetMimeTypeFn('/static/assets/200.css')).toEqual('my/custom/mime-type');
  });

  it('returns a function when contentType is an object', () => {
    const contentType = {
      '.7z': 'application/x-7z-compressed',
      '.apk': 'application/vnd.android.package-archive',
      '.appimage': 'application/x-iso9660-appimage',
      '.bin': 'application/octet-stream',
      '.bz2': 'application/x-bzip2',
      '.cfg': 'text/ini',
      '.class': 'application/java-vm',
      '.conf': 'text/ini',
      '.css': 'text/css',
      '.csv': 'text/csv',
      '.cue': 'application/octet-stream',
      '.deb': 'application/x-debian-package',
      '.dll': 'application/x-msdownload',
      '.dmg': 'application/x-apple-diskimage',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.ear': 'application/java-archive',
      '.exe': 'application/x-msdownload',
      '.gif': 'image/gif',
      '.gz': 'application/gzip',
      '.html': 'text/html',
      '.ico': 'image/x-icon',
      '.ini': 'text/ini',
      '.iso': 'application/x-iso9660-image',
      '.jar': 'application/java-archive',
      '.jpeg': 'image/jpeg',
      '.jpg': 'image/jpeg',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.log': 'text/plain',
      '.markdown': 'text/markdown',
      '.md': 'text/markdown',
      '.mp3': 'audio/mp3',
      '.mp4': 'video/mp4',
      '.ogg': 'audio/ogg',
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.rar': 'application/x-rar-compressed',
      '.rpm': 'application/x-rpm',
      '.svg': 'image/svg+xml',
      '.tar': 'application/x-tar',
      '.toml': 'text/toml',
      '.txt': 'text/plain',
      '.war': 'application/java-archive',
      '.wav': 'audio/wav',
      '.webm': 'video/webm',
      '.webp': 'image/webp',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xml': 'application/xml',
      '.yaml': 'text/yaml',
      '.yml': 'text/yaml',
      '.zip': 'application/zip',
    };
    const getContentType = getContentTypeFunc(contentType);
    expect(getContentType('')).toEqual('application/octet-stream');
    expect(getContentType('/static/assets/200.svg')).toEqual('image/svg+xml');
  });

  it('throws when contentType is wrong type', () => {
    expect(() => getContentTypeFunc([] as any)).toThrow();
    expect(() => getContentTypeFunc(null)).toThrow();
  });
});
