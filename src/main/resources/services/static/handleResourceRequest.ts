import type {
  ContentTypeResolver,
  Request,
} from '/lib/enonic/static/types';

import { getRelativeResourcePath } from '/lib/enonic/static/path/getRelativeResourcePath';
import { getResource } from '/lib/xp/io';
import { getResourceRemovingContentHash } from '/lib/enonic/static/resource/getResourceRemovingContentHash';
import { getResponseWhenResourceMatchesUrl } from './getResponseWhenResourceMatchesUrl';
import { getResponseWhenResourceMatchesUrlWithContentHashRemoved } from './getResponseWhenResourceMatchesUrlWithContentHashRemoved'
import { getIfNoneMatchHeader } from '/lib/enonic/static/request/getIfNoneMatchHeader';
import { prefixWithRoot } from '/lib/enonic/static/resource/path/prefixWithRoot';

// Pseudo code:
// if request.path matches a static resource path
//   return etag/notModified response
// if request.path (with contentHash removed) matches a static resource path
//   compare contentHash from filename with etag header
//   return resource with cache-control immutable or not modified
// else
//   return 404
export function handleResourceRequest({
  getContentType,
  request,
}: {
  request: Request
  getContentType?: ContentTypeResolver
}) {
  log.debug('handleResourceRequest: request: %s', JSON.stringify(request, null, 4));

  const relResourcePath = getRelativeResourcePath(request);
  log.debug('handleResourceRequest: relFilePath: %s', relResourcePath);

  const absResourcePathWithoutTrailingSlash = prefixWithRoot({ path: relResourcePath });
  log.debug('handleResourceRequest: absoluteResourcePathWithoutTrailingSlash: %s', absResourcePathWithoutTrailingSlash);

  const resourceMatchingUrl = getResource(absResourcePathWithoutTrailingSlash);
  // log.NOPE('resource: %s', JSON.stringify(resource, null, 4)); // Only logs {}
  log.debug('handleResourceRequest: resourceMatchingUrl exists: %s', resourceMatchingUrl.exists());

  const ifNoneMatchRequestHeader = getIfNoneMatchHeader({ request })
  if (resourceMatchingUrl.exists()) {
    return getResponseWhenResourceMatchesUrl({
      absResourcePathWithoutTrailingSlash,
      ifNoneMatchRequestHeader,
      getContentType,
      resourceMatchingUrl
    });
  } // if resource exists

  const {
    absoluteResourcePathWithoutContentHash,
    contentHashFromFilename,
    resourceWithContentHashRemoved
  } = getResourceRemovingContentHash({
    absResourcePathWithoutTrailingSlash
  });

  if (resourceWithContentHashRemoved.exists()) {
    return getResponseWhenResourceMatchesUrlWithContentHashRemoved({
      absoluteResourcePathWithoutContentHash,
      contentHashFromFilename,
      ifNoneMatchRequestHeader,
      getContentType,
      resourceWithContentHashRemoved,
    });
  }

  return {
    status: 404
  }
}