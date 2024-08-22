import type { Resource } from '/lib/xp/io';
import type {
  CacheControlResolver,
  ContentHashMismatchResponseResolver,
  ContentTypeResolver,
} from '/lib/enonic/static/types';

import { RESPONSE_NOT_MODIFIED } from '/lib/enonic/static/constants';
import { read } from '/lib/enonic/static/etagReader';
import { getMimeType } from '/lib/enonic/static/io';
import { getImmutableHeaders } from '/lib/enonic/static/response/headers/getImmutableHeaders';
import {
  notFoundResponse,
  okResponse
} from '/lib/enonic/static/response/responses';
import { isDev } from '/lib/enonic/static/runMode';


const DEBUG_PREFIX = 'getResponseWhenResourceMatchesUrlWithContentHashRemoved';

// Psuedo code:
// if the filename contentHash matches the etag
//   return immutable response
// else (aka the "contentHash" is wrong or not really a contentHash)
//   use handleContentHashMismatch
//
//   DO NOT use 307 temporary redirect to correct immutable url
//   name-notHash.ext (etag: 123) -> redirect to name-notHash-123.ext
//   name-wrongHash.ext (etag: 123) -> redirect to name-wrongHash-123.ext
//   Could end up in endless redirect loop!
export function getResponseWhenResourceMatchesUrlWithContentHashRemoved({
  absoluteResourcePathWithoutContentHash,
  contentHashFromFilename,
  ifNoneMatchRequestHeader,
  getCacheControl,
  getContentHashMismatchResponse = () => {
    return notFoundResponse();
  },
  getContentType = (path, _ignoredResource) => getMimeType(path),
  resourceWithContentHashRemoved,
} :{
  absoluteResourcePathWithoutContentHash: string
  contentHashFromFilename: string
  ifNoneMatchRequestHeader?: string
  getCacheControl?: CacheControlResolver
  getContentHashMismatchResponse?: ContentHashMismatchResponseResolver,
  getContentType?: ContentTypeResolver
  resourceWithContentHashRemoved: Resource
}) {
  log.debug('%s: contentHashFromFilename: %s', DEBUG_PREFIX, contentHashFromFilename);

  const etagWithDblFnutts = read(absoluteResourcePathWithoutContentHash);
  log.debug('%s: etagWithDblFnutts: %s', DEBUG_PREFIX, etagWithDblFnutts);

  if (
    ifNoneMatchRequestHeader && ifNoneMatchRequestHeader === etagWithDblFnutts
  ) {
    return RESPONSE_NOT_MODIFIED;
  }

  const contentType = getContentType(
    absoluteResourcePathWithoutContentHash,
    resourceWithContentHashRemoved
  );
  log.debug('%s: contentType: %s', DEBUG_PREFIX, contentType);

  const contentHashMatchesEtag = etagWithDblFnutts // No etag's in dev mode
    && etagWithDblFnutts === `"${contentHashFromFilename}"`;
  log.debug('%s: contentHashMatchesEtag: %s', DEBUG_PREFIX, contentHashMatchesEtag);
  log.debug('%s: isDev: %s', DEBUG_PREFIX, isDev());

  if (contentHashMatchesEtag) {
    return okResponse({
      body: resourceWithContentHashRemoved.getStream(),
      contentType,
      headers: getImmutableHeaders({
          getCacheControl,
          contentType,
          resource: resourceWithContentHashRemoved,
          path: absoluteResourcePathWithoutContentHash,
        })
    });
  }

  return getContentHashMismatchResponse({
    contentHash: contentHashFromFilename,
    contentType,
    etag: etagWithDblFnutts,
    resource: resourceWithContentHashRemoved
  });
}
