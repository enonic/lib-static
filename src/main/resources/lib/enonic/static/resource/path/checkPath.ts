import type {Response} from '/lib/enonic/static/types';

import {getPathError} from '/lib/enonic/static/path/getPathError';
import {isDev} from '/lib/enonic/static/runMode';
import {badRequestResponse} from '/lib/enonic/static/response/responses';


export function checkPath({
  absResourcePathWithoutTrailingSlash,
}: {
  absResourcePathWithoutTrailingSlash: string
}): Response | void {
  const pathError = getPathError(absResourcePathWithoutTrailingSlash.replace(/^\/+/, ''));
  log.debug('checkPath: pathError: %s', pathError);

  if (pathError) {
    if (isDev()) {
      return badRequestResponse({
        body: pathError,
        contentType: 'text/plain; charset=utf-8',
      });
    }
    log.warning(pathError);
    return badRequestResponse();
  }
}
