import {
  describe,
  expect,
  test as it
} from '@jest/globals';

import { internalServerErrorResponse } from '../expectations';

describe('responseOrThrow', () => {
  it('returns 500 Internal Server Error by default', () => {
    import('../../main/resources/lib/enonic/static/response/responseOrThrow').then(({ responseOrThrow }) => {
      expect(responseOrThrow({
        fn: () => {
          throw new Error('error');
        },
      })).toEqual(internalServerErrorResponse);
    });
  });

  it('throws when throwErrors = true', () => {
    import('../../main/resources/lib/enonic/static/response/responseOrThrow').then(({ responseOrThrow }) => {
      expect(() => responseOrThrow({
        fn: () => {
          throw new Error('error');
        },
        throwErrors: true
      })).toThrow('error');
    });
  });

});
