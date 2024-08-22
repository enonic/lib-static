import type { ImmutableRequestHandler } from '/lib/enonic/static/types';

import { getResource } from '/lib/xp/io';
import { getConfiguredImmutableCacheControlHeader } from '/lib/enonic/static/config';
import { getMimeType } from '/lib/enonic/static/io';
import { getEtagOrNotModifiedOrNoCacheResponse } from '/lib/enonic/static/response/getEtagOrNotModifiedOrNoCacheResponse';
import { getImmutableHeaders } from '/lib/enonic/static/response/headers/getImmutableHeaders';
import { responseOrThrow } from '/lib/enonic/static/response/responseOrThrow';
import {
  notFoundResponse,
  okResponse
} from '/lib/enonic/static/response/responses';
import { getAbsoluteResourcePathWithoutTrailingSlash } from '/lib/enonic/static/resource/path/getAbsoluteResourcePathWithoutTrailingSlash';
import { checkPath } from '/lib/enonic/static/resource/path/checkPath';


export const immutableRequestHandler: ImmutableRequestHandler = ({
  etagCacheControlHeader, // Defaults set in getEtagOrNotModifiedOrNoCacheResponse
  etagProcessing, // Defaults set in getEtagOrNotModifiedOrNoCacheResponse
  getContentType = (path) => getMimeType(path),
  getImmutableCacheControlHeader = getConfiguredImmutableCacheControlHeader,
  request,
  root,
  throwErrors,
  useEtagWhen = ({ contentType }) => contentType === 'text/html'
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

      if (useEtagWhen({
        contentType
      })) {
        return getEtagOrNotModifiedOrNoCacheResponse({
          absResourcePathWithoutTrailingSlash,
          contentType,
          etagCacheControlHeader,
          etagProcessing,
          request,
          resource: resourceMatchingUrl
        });
      } // useEtagWhen

      return okResponse({
        body: resourceMatchingUrl.getStream(),
        contentType,
        headers: getImmutableHeaders({
            getCacheControl: getImmutableCacheControlHeader,
            contentType,
            resource: resourceMatchingUrl,
            path: absResourcePathWithoutTrailingSlash,
          })
      });
    }, // fn
  }); // responseOrThrow
}
