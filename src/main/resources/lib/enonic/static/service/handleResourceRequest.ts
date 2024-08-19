import type {
  CacheControlResolver,
  ContentHashMismatchResponseResolver,
  ContentTypeResolver,
  Request,
} from '/lib/enonic/static/types';

import { getPathError } from '/lib/enonic/static/path/getPathError';
import { getRelativeResourcePath } from '/lib/enonic/static/path/getRelativeResourcePath';
import { getResource } from '/lib/xp/io';
import { getResourceRemovingContentHash } from '/lib/enonic/static/resource/getResourceRemovingContentHash';
import { getResponseWhenResourceMatchesUrl } from './getResponseWhenResourceMatchesUrl';
import { getResponseWhenResourceMatchesUrlWithContentHashRemoved } from './getResponseWhenResourceMatchesUrlWithContentHashRemoved'
import { getIfNoneMatchHeader } from '/lib/enonic/static/request/getIfNoneMatchHeader';
import { prefixWithRoot } from '/lib/enonic/static/resource/path/prefixWithRoot';
import {
  badRequestResponse,
  internalServerErrorResponse,
  notFoundResponse
} from '/lib/enonic/static/response/responses';
import { generateErrorId } from '/lib/enonic/static/response/generateErrorId';
import { isDev } from '/lib/enonic/static/runMode';

const DEBUG_PREFIX = 'handleResourceRequest';

// Pseudo code:
// if request.path matches a static resource path
//   return etag/notModified response
// if request.path (with contentHash removed) matches a static resource path
//   compare contentHash from filename with etag header
//   return resource with cache-control immutable or not modified
// else
//   return 404
export function handleResourceRequest({
  getCacheControl,
  getContentHashMismatchResponse,
  getContentType,
  request,
  root,
  throwErrors = false,
}: {
  request: Request
  getCacheControl?: CacheControlResolver
  getContentHashMismatchResponse?: ContentHashMismatchResponseResolver,
  getContentType?: ContentTypeResolver
  root?: string
  throwErrors?: boolean
}) {
  try {
    log.debug('%s: request: %s', DEBUG_PREFIX, JSON.stringify(request, null, 4));

    const relResourcePath = getRelativeResourcePath(request);
    log.debug('handleResourceRequest: relFilePath: %s', relResourcePath);

    const absResourcePathWithoutTrailingSlash = prefixWithRoot({
      path: relResourcePath,
      root
    });
    log.debug('handleResourceRequest: absoluteResourcePathWithoutTrailingSlash: %s', absResourcePathWithoutTrailingSlash);

    const pathError = getPathError(absResourcePathWithoutTrailingSlash.replace(/^\/+/, ''));
    log.debug('%s: pathError: %s', DEBUG_PREFIX, pathError);

    if (pathError) {
      if (isDev()) {
        return badRequestResponse({
          body: pathError,
          contentType: 'text/plain; charset=utf-8',
        });
      }
      log.warning(pathError);
      return badRequestResponse();
    }

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
        getCacheControl,
        getContentHashMismatchResponse,
        getContentType,
        resourceWithContentHashRemoved,
      });
    }

    return notFoundResponse();

  } catch (e) {
    if (throwErrors) {
      throw e;
    } else {
      const errorId = generateErrorId();
      log.error(`lib-static.handleResourceRequest, error ID: ${errorId}   |   ${e.message}`, e);
      return internalServerErrorResponse({
        contentType: 'text/plain; charset=utf-8',
        body: `Server error (logged with error ID: ${errorId})`
      });
    }
  } // try ... catch

} // handleResourceRequest
