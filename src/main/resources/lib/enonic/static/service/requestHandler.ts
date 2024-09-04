import type { RequestHandler } from '/lib/enonic/static/types';

import {
  getConfiguredCacheControl,
  getConfiguredEtag,
} from '/lib/enonic/static/config';
import {
  HTTP2_RESPONSE_HEADER,
  RESPONSE_CACHE_CONTROL_DIRECTIVE,
  RESPONSE_NOT_MODIFIED,
} from '/lib/enonic/static/constants';
import { read } from '/lib/enonic/static/etagReader';
import { getResource } from '/lib/enonic/static/io';
import { getIfNoneMatchHeader } from '/lib/enonic/static/request/getIfNoneMatchHeader';
import { getMimeType } from '/lib/enonic/static/io';
import { responseOrThrow } from '/lib/enonic/static/response/responseOrThrow';
import {
  movedPermanentlyResponse,
  notFoundResponse,
  okResponse
} from '/lib/enonic/static/response/responses';
import { getAbsoluteResourcePathWithoutTrailingSlash } from '/lib/enonic/static/resource/path/getAbsoluteResourcePathWithoutTrailingSlash';
import { checkPath } from '/lib/enonic/static/resource/path/checkPath';
import { isDev } from '/lib/enonic/static/runMode';


export const requestHandler: RequestHandler = ({
  cacheControlFn = getConfiguredCacheControl,
  contentTypeFn = ({ path }) => getMimeType(path),
  index = 'index.html',
  request,
  root,
  throwErrors,
}) => {
  return responseOrThrow({
    throwErrors,
    fn: () => {
      let indexAndNoTrailingSlash = false;
      if (index) {
        if (typeof request.rawPath !== 'string') {
          const msg = `Invalid request without rawPath: ${JSON.stringify(request)}! request.rawPath is needed when index is set to "${index}"`;
          log.error(msg);
          throw new Error(msg);
        }
        if (request.rawPath.endsWith('/')) {
          request.rawPath += index;
        } else {
          indexAndNoTrailingSlash = true;
        }
      } // if index

      const absResourcePathWithoutTrailingSlash = getAbsoluteResourcePathWithoutTrailingSlash({
        request,
        root // default is set and checked in prefixWithRoot
      });

      const errorResponse = checkPath({ absResourcePathWithoutTrailingSlash });
      if (errorResponse) {
        return errorResponse;
      }

      const resourceMatchingUrl = getResource(absResourcePathWithoutTrailingSlash);

      if (indexAndNoTrailingSlash && resourceMatchingUrl.isDirectory()) {
        return movedPermanentlyResponse({
          location: `${request.path}/`
        });
      }

      if (!resourceMatchingUrl.exists()) {
        return notFoundResponse();
      }

      const contentType = contentTypeFn({
        path: absResourcePathWithoutTrailingSlash,
        resource: resourceMatchingUrl
      });

      if(isDev()) {
        return okResponse({
          body: resourceMatchingUrl.getStream(),
          contentType,
          headers: {
            [HTTP2_RESPONSE_HEADER.CACHE_CONTROL]: RESPONSE_CACHE_CONTROL_DIRECTIVE.NO_STORE
          }
        });
      }

      // Production
      const headers = {
        [HTTP2_RESPONSE_HEADER.CACHE_CONTROL]: cacheControlFn({
          contentType,
          path: absResourcePathWithoutTrailingSlash,
          resource: resourceMatchingUrl,
        })
      };

      let etag = getConfiguredEtag();
      if (etag === 'auto') {
        etag = headers[HTTP2_RESPONSE_HEADER.CACHE_CONTROL].includes('immutable') ? 'off' : 'on';
      }

      if (etag === 'on') {
        const etagWithDblFnutts = read(absResourcePathWithoutTrailingSlash);
        const ifNoneMatchRequestHeader = getIfNoneMatchHeader({ request })
        if (
          ifNoneMatchRequestHeader
          && ifNoneMatchRequestHeader === etagWithDblFnutts
        ) {
          return RESPONSE_NOT_MODIFIED;
        }
        headers[HTTP2_RESPONSE_HEADER.ETAG] = etagWithDblFnutts;
      } // etag === 'on'

      return okResponse({
        body: resourceMatchingUrl.getStream(),
        contentType,
        headers
      });
    } // fn
  }); // responseOrThrow
}
