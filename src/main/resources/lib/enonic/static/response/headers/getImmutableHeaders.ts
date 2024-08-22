import type {Resource} from '@enonic-types/lib-io';
import type {
  CacheControlResolver,
  Response,
} from '/lib/enonic/static/types';

import {
  CACHE_CONTROL_IMMUTABLE,
  HTTP2_RESPONSE_HEADER_NAME_CACHE_CONTROL,
} from '/lib/enonic/static/constants';


export function getImmutableHeaders({
  getCacheControl,
  contentType,
  path,
  resource
}: {
  getCacheControl?: CacheControlResolver
  path?: string,
  resource?: Resource,
  contentType?: string
} = {}) : Response['headers']
{
  let cacheControl: string = CACHE_CONTROL_IMMUTABLE;
  if (getCacheControl) {
    const result = getCacheControl(path, resource, contentType);
      if (result !== null) {
        cacheControl = result;
      }
  }
  return {
    [HTTP2_RESPONSE_HEADER_NAME_CACHE_CONTROL]: cacheControl
  };
}
