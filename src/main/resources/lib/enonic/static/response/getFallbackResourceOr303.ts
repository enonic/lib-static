import type { Resource } from '/lib/xp/io';
import type {
  Request,
  Response
} from '/lib/enonic/static/types';

import { getResource } from '/lib/enonic/static/io';
import { isDev } from '/lib/enonic/static/runMode';


// TODO: if other options than index.html are preferrable or overridable by options later (Issue #57),
//  replace this function at runtime with indexFallbackFunc.
//  Implemented as array in preparation for that.
const getIndexFallbacks = (_path: string) => ['index.html'];

export const getFallbackResourceOr303 = (
  path: string,
  request: Request,
  hasTrailingSlash: boolean
): {
  res?: Resource
  fallback?: string
  response303?: Response
} => {
  const indexFallbacks = getIndexFallbacks(path).map( indexFile =>
      path +
      (!hasTrailingSlash ? '/' : '') +
      indexFile
  );
  log.debug('getFallbackResourceOr303: indexFallbacks: %s', JSON.stringify(indexFallbacks, null, 4));

  for (let i=0; i<indexFallbacks.length; i++) {

    const fallbackPath = indexFallbacks[i];
    const resource = getResource(fallbackPath);

    if (resource.exists()) {
      if (hasTrailingSlash) {
        if (isDev()) {
            log.info(`Resource fallback for '${path}': returning '${fallbackPath}'`);
        }
        return {
          res: resource,
          fallback: fallbackPath
        };

      } else {
        if (isDev()) {
          log.info(`Not found: '${path}'. However, a fallback exists: '${fallbackPath}'. Redirecting to fetch it from '${request.path}/'.`);
        }
        return {
          response303: {
            // Assumes this is the correct redirect, whatever happened in a getCleanPath override
            redirect: request.path + '/'
          }
        };
      }
    }
  } // for indexFallbacks

  return {};
}
