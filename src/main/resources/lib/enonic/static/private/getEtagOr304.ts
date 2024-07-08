import type {
  Request,
  Response
} from '../types';

import { read } from '/lib/enonic/static/etagReader';
import { lcKeys } from '/lib/enonic/static/private/lcKeys';


export const getEtagOr304 = (
  path: string,
  request: Request,
  etagOverride?: boolean
): {
  etag?: string
  response304?: Response
} => {
  let etag = read(path, etagOverride);
  log.debug('getEtagOr304: etag: %s', etag);

  let ifNoneMatch = lcKeys(request.headers || {})['if-none-match'];
  log.debug('getEtagOr304: ifNoneMatch: %s', ifNoneMatch);

  if (ifNoneMatch && ifNoneMatch === etag) {
    return {
      response304: {
        status: 304
      }
    };
  }
  return { etag };
}
