import type { Resource } from '/lib/xp/io';
import type { ContentTypeResolver } from '/lib/enonic/static/types';

import { RESPONSE_NOT_MODIFIED } from '/lib/enonic/static/constants';
import { read } from '/lib/enonic/static/etagReader';
import { getMimeType } from '/lib/enonic/static/io';
import { getEtagHeaders } from '/lib/enonic/static/response/headers/getEtagHeaders';
import { getImmuteableHeaders } from '/lib/enonic/static/response/headers/getImmuteableHeaders';
import { isDev } from '/lib/enonic/static/runMode';


const DEBUG_PREFIX = 'getResponseWhenResourceMatchesUrlWithContentHashRemoved';

// Psuedo code:
// if the filename contentHash matches the etag
//   return immuteable response
// else (aka the "contentHash" is wrong or not really a contentHash)
//   fallback to etag/notModified response
//
//   DO NOT use 307 temporary redirect to correct immuteable url
//   name-notHash.ext (etag: 123) -> redirect to name-notHash-123.ext
//   name-wrongHash.ext (etag: 123) -> redirect to name-wrongHash-123.ext
//   Could end up in endless redirect loop!
export function getResponseWhenResourceMatchesUrlWithContentHashRemoved({
  absoluteResourcePathWithoutContentHash,
  contentHashFromFilename,
  ifNoneMatchRequestHeader,
  getContentType = (path, _ignoredResource) => getMimeType(path),
  resourceWithContentHashRemoved,
} :{
  absoluteResourcePathWithoutContentHash: string
  contentHashFromFilename: string
  ifNoneMatchRequestHeader?: string
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

  if (
    !contentHashMatchesEtag
    // Since Etag is not computed in dev mode, this would log on every request!
    && !isDev()
  ) {
    log.debug(
      '%s: Etag mismatch: In url: "%s" From resource: %s. Falling back to etag response.',
      DEBUG_PREFIX,
      contentHashFromFilename,
      etagWithDblFnutts,
    );
  }

  return {
    body: resourceWithContentHashRemoved.getStream(),
    contentType,
    headers: contentHashMatchesEtag
      ? getImmuteableHeaders()
      : getEtagHeaders({ etagWithDblFnutts }),
    status: 200
  }
}
