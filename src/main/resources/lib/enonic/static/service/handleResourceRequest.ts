import type {
  // CacheControlResolver,
  // Config,
  ContentHashMismatchResponseResolver,
  ContentTypeResolver,
  MatchResourceResponseResolver,
  MatchResourceStemResponseResolver,
  Request,
} from '/lib/enonic/static/types';

import {
  CACHE_CONTROL_NO_CACHE,
  HTTP2_RESPONSE_HEADER_NAME_CACHE_CONTROL,
} from '/lib/enonic/static/constants';
import {
  getConfig,
  // getImmutableCacheControlHeader
} from '/lib/enonic/static/config';
import { read } from '/lib/enonic/static/etagReader';
import { getMimeType } from '/lib/enonic/static/io';
import { getAbsoluteResourcePathWithoutTrailingSlash } from '/lib/enonic/static/resource/path/getAbsoluteResourcePathWithoutTrailingSlash';
// import { getPathError } from '/lib/enonic/static/path/getPathError';
// import { getRelativeResourcePath } from '/lib/enonic/static/path/getRelativeResourcePath';
import { getResource } from '/lib/xp/io';
import { getResourceRemovingContentHash } from '/lib/enonic/static/resource/getResourceRemovingContentHash';
// import { getResponseWhenResourceMatchesUrl } from './getResponseWhenResourceMatchesUrl';
// import { getResponseWhenResourceMatchesUrlWithContentHashRemoved } from './getResponseWhenResourceMatchesUrlWithContentHashRemoved'
import { getIfNoneMatchHeader } from '/lib/enonic/static/request/getIfNoneMatchHeader';
import { getEtagHeaders } from '/lib/enonic/static/response/headers/getEtagHeaders'
import { getImmutableHeaders } from '/lib/enonic/static/response/headers/getImmutableHeaders';
import { checkPath } from '/lib/enonic/static/resource/path/checkPath';
import {
  okResponse,
  notFoundResponse
} from '/lib/enonic/static/response/responses';
import { responseOrThrow } from '/lib/enonic/static/response/responseOrThrow';

const DEBUG_PREFIX = 'handleResourceRequest';

// Behaves differently based on config:
// 1. Default behaviour is eTag url matches resource, or 404
//    1.1 In dev mode there is currently no etag, but this could be added
// 2. if config.cacheStrategy === 'immutable'
//      respond immutable if matches resource, etag for html, or 404
// 3. Other behaviours require rolling your own service and passing callbacks.



// Pseudo code:
// if request.path matches a static resource path
//   return etag/notModified response
// if request.path (with contentHash removed) matches a static resource path
//   compare contentHash from filename with etag header
//   return resource with cache-control immutable or not modified
// else
//   return 404
// const defaultCacheControlResolver: CacheControlResolver = getImmutableCacheControlHeader;


const defaultMatchResourceResponseHandler: MatchResourceResponseResolver = ({
  contentType,
  path,
  resource
}) => {
  const {
    cacheStrategy,
    etagProcessing
  } = getConfig();
  if (cacheStrategy === 'etag') {
    const etagOverride = etagProcessing === 'auto'
      ? undefined
      : etagProcessing === 'always'; // etagProcessing === 'never' ? false
    const etagWithDblFnutts = read(path, etagOverride);
    return {
      body: resource.getStream(),
      contentType,
      headers: etagWithDblFnutts ? getEtagHeaders({ etagWithDblFnutts }) : {
        [HTTP2_RESPONSE_HEADER_NAME_CACHE_CONTROL]: CACHE_CONTROL_NO_CACHE
      },
      status: 200
    }
  }
  if (cacheStrategy === 'immutable') {
    return okResponse({
      body: resource.getStream(),
      contentType,
      headers: getImmutableHeaders({
          getCacheControl,
          contentType,
          resource,
          path,
        })
    });
  }
  const msg = `Unsupported cache strategy:${cacheStrategy}`;
  throw new Error('Unsupported cache strategy');
}

const defaultMatchResourceStemResponseResolver: MatchResourceStemResponseResolver = () => notFoundResponse();

export function handleResourceRequest({
  getMatchResourceResponse = defaultMatchResourceResponseHandler,
  getMatchResourceStemResponse = defaultMatchResourceStemResponseResolver,
  // etagProcessing = getEtag(),
  // getCacheControl = defaultCacheControlResolver,
  getContentHashMismatchResponse,
  getContentType = (path, _ignoredResource) => getMimeType(path),
  request,
  root,
  throwErrors = false,
}: {
  // etag?: Config['etagProcessing']
  request: Request
  // getCacheControl?: CacheControlResolver
  getContentHashMismatchResponse?: ContentHashMismatchResponseResolver,
  getContentType?: ContentTypeResolver
  getMatchResourceResponse?: MatchResourceResponseResolver
  getMatchResourceStemResponse?: MatchResourceStemResponseResolver
  root?: string
  throwErrors?: boolean
}) {
  return responseOrThrow({
    throwErrors,
    fn: () => {
      log.debug('%s: request: %s', DEBUG_PREFIX, JSON.stringify(request, null, 4));

      const absResourcePathWithoutTrailingSlash = getAbsoluteResourcePathWithoutTrailingSlash({
        request,
        root // default is set and checked in prefixWithRoot
      });
      log.debug('handleResourceRequest: absoluteResourcePathWithoutTrailingSlash: %s', absResourcePathWithoutTrailingSlash);

      const errorResponse = checkPath({absResourcePathWithoutTrailingSlash});
      if (errorResponse) {
        return errorResponse;
      }

      const resourceMatchingUrl = getResource(absResourcePathWithoutTrailingSlash);
      // log.NOPE('resource: %s', JSON.stringify(resource, null, 4)); // Only logs {}
      log.debug('handleResourceRequest: resourceMatchingUrl exists: %s', resourceMatchingUrl.exists());

      const ifNoneMatchRequestHeader = getIfNoneMatchHeader({ request })
      if (resourceMatchingUrl.exists()) {
        return getMatchResourceResponse({
          contentType: getContentType(absResourcePathWithoutTrailingSlash, resourceMatchingUrl),
          path: absResourcePathWithoutTrailingSlash,
          resource: resourceMatchingUrl,
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
        return getMatchResourceStemResponse({
          contentType: getContentType(absResourcePathWithoutTrailingSlash, resourceWithContentHashRemoved),
          path: absResourcePathWithoutTrailingSlash,
          resource: resourceWithContentHashRemoved,
        });
        // return getResponseWhenResourceMatchesUrlWithContentHashRemoved({
        //   absoluteResourcePathWithoutContentHash,
        //   contentHashFromFilename,
        //   ifNoneMatchRequestHeader,
        //   getCacheControl,
        //   getContentHashMismatchResponse,
        //   getContentType,
        //   resourceWithContentHashRemoved,
        // });
      }

      return notFoundResponse();

    } // fn
  }); // responseOrThrow
} // handleResourceRequest
