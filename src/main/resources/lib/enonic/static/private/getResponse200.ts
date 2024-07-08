import type { Response } from '../types';

import { INDEXFALLBACK_CACHE_CONTROL } from '/lib/enonic/static/constants';


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

  return {
    body: resource.getStream(),
    contentType,
    headers,
    status: 200,
  };
};
