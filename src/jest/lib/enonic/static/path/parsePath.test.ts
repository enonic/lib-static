import {
  describe,
  expect,
  test as it
} from '@jest/globals';
import { parsePath } from '../../../../../main/resources/lib/enonic/static/path/parsePath';


const TEST_CASES = [
  ['','','', ''],
  ['/','/','', ''],
  ['//','/','', ''],
  // You can't know if it's a dir or a file, so it's a filename.
  ['/couldBeDirOrFile','/','couldBeDirOrFile', ''],
  ['/dir/','/dir/','', ''],
  ['name','','name', ''],
  ['/name','/','name', ''],
  ['name.ext','','name', 'ext'],
  ['/name.ext','/','name', 'ext'],
  ['/dir/name.ext','/dir/','name', 'ext'],
  ['/dir/name-hash.ext','/dir/','name-hash', 'ext'],
  ['//dir//name.ext//','/dir/name.ext/','', ''],
];


describe('parsePath', () => {
  TEST_CASES.forEach(([path, dir, filename, ext]) => {
    it(`parses '${path}' to { dir: '${dir}' filename: '${filename}' ext: '${ext}' }`, () => {
      expect(parsePath({ path })).toEqual({
        dir,
        ext,
        filename
      });
    });
  });
});
