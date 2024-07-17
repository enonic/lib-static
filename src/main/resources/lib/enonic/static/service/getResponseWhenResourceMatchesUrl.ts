import type { Resource } from '/lib/xp/io';
import type { ContentTypeResolver } from '/lib/enonic/static/types';

import {
  CACHE_CONTROL_NO_CACHE,
  HTTP2_RESPONSE_HEADER_NAME_CACHE_CONTROL,
  HTTP2_RESPONSE_HEADER_NAME_ETAG,
  RESPONSE_NOT_MODIFIED
} from '/lib/enonic/static/constants';
import { read } from '/lib/enonic/static/etagReader';
import { okResponse } from '/lib/enonic/static/response/responses';
import { getMimeType } from '/lib/enonic/static/io';


const DEBUG_PREFIX = 'getResponseWhenResourceMatchesUrl';

// NOTE: The resource filename might contain some kind of contenthash created at
// build time, but we can't know it's uniq/immuteable, in comparison to our
// runtime contenthashes (etag).
export function getResponseWhenResourceMatchesUrl({
  absResourcePathWithoutTrailingSlash,
  ifNoneMatchRequestHeader,
  getContentType = (path, _ignoredResource) => getMimeType(path),
  resourceMatchingUrl,
}: {
  absResourcePathWithoutTrailingSlash: string
  ifNoneMatchRequestHeader?: string
  getContentType?: ContentTypeResolver
  resourceMatchingUrl: Resource
}) {
  const etagWithDblFnutts = read(absResourcePathWithoutTrailingSlash);
  log.debug('%s: etagWithDblFnutts: %s', DEBUG_PREFIX, etagWithDblFnutts);

  if (
    ifNoneMatchRequestHeader && ifNoneMatchRequestHeader === etagWithDblFnutts
  ) {
    return RESPONSE_NOT_MODIFIED;
  }

  const contentType = getContentType(
    absResourcePathWithoutTrailingSlash,
    resourceMatchingUrl
  );
  log.debug('%s: contentType: %s', DEBUG_PREFIX, contentType);

  const headers = {
    [HTTP2_RESPONSE_HEADER_NAME_CACHE_CONTROL]: CACHE_CONTROL_NO_CACHE
  };

  if (etagWithDblFnutts) { // No etag's in dev mode
    headers[HTTP2_RESPONSE_HEADER_NAME_ETAG] = etagWithDblFnutts;
  }

  return okResponse({
    body: resourceMatchingUrl.getStream(),
    contentType,
    headers,
  });
}
