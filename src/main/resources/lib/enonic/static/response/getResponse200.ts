import type { Response } from '/lib/enonic/static/types';

import { INDEXFALLBACK_CACHE_CONTROL } from '/lib/enonic/static/constants';
import { okResponse } from '/lib/enonic/static/response/responses';


export const getResponse200 = (
  path: string,
  resource,
  contentTypeFunc,
  cacheControlFunc,
  etag: string|number,
  fallbackPath?: string
) => {
  const contentType = contentTypeFunc(fallbackPath || path, resource);
  const cacheControlHeader = fallbackPath
    ? INDEXFALLBACK_CACHE_CONTROL
    : cacheControlFunc(path, resource, contentType);

  // Preventing any keys under 'header' with null/undefined values (since those cause NPE):
  const headers: Response['headers'] = {};
  if (cacheControlHeader) {
    headers['cache-control'] = cacheControlHeader;
  }
  if (etag) {
    headers.etag = etag;
  }

  return okResponse({
    body: resource.getStream(),
    contentType,
    headers,
  });
};
