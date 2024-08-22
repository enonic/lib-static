import type { EtagRequestHandler } from '/lib/enonic/static/types';

import { getResource } from '/lib/xp/io';
import { getMimeType } from '/lib/enonic/static/io';
import { getAbsoluteResourcePathWithoutTrailingSlash } from '/lib/enonic/static/resource/path/getAbsoluteResourcePathWithoutTrailingSlash';
import { checkPath } from '/lib/enonic/static/resource/path/checkPath';
import { responseOrThrow } from '/lib/enonic/static/response/responseOrThrow';
import { notFoundResponse } from '/lib/enonic/static/response/responses';
import { getEtagOrNotModifiedOrNoCacheResponse } from '/lib/enonic/static/response/getEtagOrNotModifiedOrNoCacheResponse';


export const etagRequestHandler: EtagRequestHandler = ({
  etagCacheControlHeader, // Defaults set in getEtagOrNotModifiedOrNoCacheResponse
  etagProcessing, // Defaults set in getEtagOrNotModifiedOrNoCacheResponse
  getContentType = (path) => getMimeType(path),
  request,
  root,
  throwErrors
}) => {
  return responseOrThrow({
    throwErrors,
    fn: () => {
      const absResourcePathWithoutTrailingSlash = getAbsoluteResourcePathWithoutTrailingSlash({
        request,
        root // default is set and checked in prefixWithRoot
      });

      const errorResponse = checkPath({ absResourcePathWithoutTrailingSlash });
      if (errorResponse) {
        return errorResponse;
      }

      const resourceMatchingUrl = getResource(absResourcePathWithoutTrailingSlash);

      if (!resourceMatchingUrl.exists()) {
        return notFoundResponse();
      }

      const contentType = getContentType(absResourcePathWithoutTrailingSlash, resourceMatchingUrl);

      return getEtagOrNotModifiedOrNoCacheResponse({
        absResourcePathWithoutTrailingSlash,
        contentType,
        etagCacheControlHeader,
        etagProcessing,
        request,
        resource: resourceMatchingUrl
      });
    }, // fn
  }); // responseOrThrow
}
