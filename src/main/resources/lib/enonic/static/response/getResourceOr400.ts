import type { Resource } from '/lib/xp/io';
import type { Response } from '/lib/enonic/static/types';

import { getResource } from '/lib/enonic/static/io';
import { isDev } from '/lib/enonic/static/runMode';


export const getResourceOr400 = (
  path: string,
  pathError: string,
  hasTrailingSlash?: boolean
): {
  resource?: Resource
  response400?: Response
} => {
  if (pathError) {
    if (!isDev()) {
      log.warning(pathError);
    }
    return {
      response400: (isDev())
        ? {
          status: 400,
          body: pathError,
          contentType: 'text/plain; charset=utf-8'
        }
        : {
          status: 400,
        }
    };
  }


  if (!hasTrailingSlash) {
    const resource = getResource(path);
    if (resource.exists()) {
      return { resource };
    }
  }

  return {};
};
