import type { Response } from '/lib/enonic/static/types';

import { generateErrorId } from '/lib/enonic/static/response/generateErrorId';
import { internalServerErrorResponse } from '/lib/enonic/static/response/responses';


export function responseOrThrow({
  fn,
  throwErrors
}: {
  fn: () => Response
  throwErrors?: boolean
}) {
  try {
    return fn();
  } catch (e) {
    if (throwErrors) {
      throw e;
    } else {
      const errorId = generateErrorId();
      log.error(`lib-static.handleResourceRequest, error ID: ${errorId}   |   ${e.message}`, e);
      return internalServerErrorResponse({
        contentType: 'text/plain; charset=utf-8',
        body: `Server error (logged with error ID: ${errorId})`
      });
    }
  } // try ... catch
}
