import type {ByteSource} from '/lib/xp/io';
import type {Response} from '/lib/enonic/static/types';

import {generateErrorId} from '/lib/enonic/static/response/generateErrorId';
import {internalServerErrorResponse} from '/lib/enonic/static/response/responses';


export function responseOrThrow({
  fn,
  throwErrors,
}: {
  fn: () => Response
  throwErrors?: boolean
}): Response<string | ByteSource, {
  'content-type'?: string;
  'cache-control'?: string;
  'content-security-policy'?: string;
  etag?: string | number;
  location?: string;
}> {
  try {
    return fn();
  } catch (e) {
    if (throwErrors) {
      throw e;
    } else {
      const errorId = generateErrorId();
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      log.error(`lib-static.handleResourceRequest, error ID: ${errorId}   |   ${errorMessage}`, e);
      return internalServerErrorResponse({
        contentType: 'text/plain; charset=utf-8',
        body: `Server error (logged with error ID: ${errorId})`,
      });
    }
  } // try ... catch
}
