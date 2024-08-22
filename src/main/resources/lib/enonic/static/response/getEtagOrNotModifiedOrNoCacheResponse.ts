import type {
  EtagProcessing,
  Request,
  Resource,
  Response
} from '/lib/enonic/static/types';

import {
  getConfiguredEtagCacheControlHeader,
  getConfiguredEtagProcessing
} from '/lib/enonic/static/config';
import {
  CACHE_CONTROL_NO_CACHE,
  HTTP2_RESPONSE_HEADER_NAME_CACHE_CONTROL,
  HTTP2_RESPONSE_HEADER_NAME_ETAG,
  RESPONSE_NOT_MODIFIED,
} from '/lib/enonic/static/constants';
import { read } from '/lib/enonic/static/etagReader';
import { getIfNoneMatchHeader } from '/lib/enonic/static/request/getIfNoneMatchHeader';
import { okResponse } from '/lib/enonic/static/response/responses';


export function getEtagOrNotModifiedOrNoCacheResponse({
  absResourcePathWithoutTrailingSlash,
  contentType,
  etagCacheControlHeader = getConfiguredEtagCacheControlHeader(),
  etagProcessing = getConfiguredEtagProcessing(),
  request,
  resource,
}: {
  absResourcePathWithoutTrailingSlash: string
  contentType: string
  etagCacheControlHeader?: string
  etagProcessing?: EtagProcessing
  request: Request
  resource: Resource
}): Response {
  const etagOverride = etagProcessing === 'auto'
    ? undefined
    : etagProcessing === 'always'; // etagProcessing === 'never' ? false
  const etagWithDblFnutts = read(absResourcePathWithoutTrailingSlash, etagOverride);

  if (!etagWithDblFnutts) {
    return okResponse({
      body: resource.getStream(),
      contentType,
      headers: {
          [HTTP2_RESPONSE_HEADER_NAME_CACHE_CONTROL]: CACHE_CONTROL_NO_CACHE
      },
    });
  }

  const ifNoneMatchRequestHeader = getIfNoneMatchHeader({ request })
  if (
    ifNoneMatchRequestHeader
    && ifNoneMatchRequestHeader === etagWithDblFnutts
  ) {
    return RESPONSE_NOT_MODIFIED;
  }

  return okResponse({
    body: resource.getStream(),
    contentType,
    headers: {
        [HTTP2_RESPONSE_HEADER_NAME_CACHE_CONTROL]: etagCacheControlHeader,
        [HTTP2_RESPONSE_HEADER_NAME_ETAG]: etagWithDblFnutts,
      },
  });
}
