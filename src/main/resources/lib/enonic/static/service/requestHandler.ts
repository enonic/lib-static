import type { RequestHandler } from '/lib/enonic/static/types';

import {
  HTTP2_RESPONSE_HEADER,
  RESPONSE_CACHE_CONTROL_DIRECTIVE,
} from '/lib/enonic/static/constants';
import { read } from '/lib/enonic/static/etagReader';
import { getResource } from '/lib/enonic/static/io';
import { getIfNoneMatchHeader } from '/lib/enonic/static/request/getIfNoneMatchHeader';
import { getMimeType } from '/lib/enonic/static/io';
import { responseOrThrow } from '/lib/enonic/static/response/responseOrThrow';
import { getRelativeResourcePath } from '/lib/enonic/static/path/getRelativeResourcePath';
import { webAppCacheControl } from '/lib/enonic/static/service/webAppCacheControl';
import {
  badRequestResponse,
  movedPermanentlyResponse,
  notFoundResponse,
  notModifiedResponse,
  okResponse
} from '/lib/enonic/static/response/responses';
import { prefixWithRoot } from '/lib/enonic/static/resource/path/prefixWithRoot';
import { checkPath } from '/lib/enonic/static/resource/path/checkPath';
import { isDev } from '/lib/enonic/static/runMode';


export const requestHandler: RequestHandler = ({
  cacheControl: cacheControlFn = webAppCacheControl,
  contentType: contentTypeFn = ({ path }) => getMimeType(path),
  etag = true,
  index = 'index.html',
  relativePath: relativePathFn = getRelativeResourcePath,
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
          if(isDev()) {
            return badRequestResponse({
              body: msg,
              contentType: 'text/plain; charset=utf-8'
            });
          }
          log.warning(msg);
          return badRequestResponse();
        }
        if (request.rawPath.endsWith('/')) {
          request.rawPath += index;
        } else {
          indexAndNoTrailingSlash = true;
        }
      } // if index

      const relativePath = relativePathFn(request);

      const absResourcePathWithoutTrailingSlash = prefixWithRoot({
        path: relativePath,
        root
      });

      const errorResponse = checkPath({ absResourcePathWithoutTrailingSlash });
      if (errorResponse) {
        return errorResponse;
      }

      const resource = getResource(absResourcePathWithoutTrailingSlash);

      if (indexAndNoTrailingSlash && !resource.exists()) {
        request.rawPath += `/${index}`;
        const indexAbsPath = prefixWithRoot({
          path: relativePathFn(request),
          root
        });
        const indexResource = getResource(indexAbsPath);
        if (indexResource.exists()) {
          if(!request.path) {
            const msg = `Invalid request without path: ${JSON.stringify(request)}! request.path is needed when index is enabled and the request path does not end with a slash.`;
            if(isDev()) {
              return badRequestResponse({
                body: msg,
                contentType: 'text/plain; charset=utf-8'
              });
            }
            log.warning(msg);
            return badRequestResponse();
          }
          return movedPermanentlyResponse({
            location: `${request.path}/`
          });
        }
      }

      if (!resource.exists()) {
        return notFoundResponse();
      }

      const contentType = contentTypeFn({
        path: absResourcePathWithoutTrailingSlash,
        resource
      });

      if(isDev()) {
        return okResponse({
          body: resource.getStream(),
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
          path: relativePath,
          resource
        })
      };

      if (etag) {
        const etagWithDblFnutts = read(absResourcePathWithoutTrailingSlash);
        const ifNoneMatchRequestHeader = getIfNoneMatchHeader({ request })
        headers[HTTP2_RESPONSE_HEADER.ETAG] = etagWithDblFnutts;
        if (
          ifNoneMatchRequestHeader
          && ifNoneMatchRequestHeader === etagWithDblFnutts
        ) {
          return notModifiedResponse({
            headers
          });
        }
      }

      return okResponse({
        body: resource.getStream(),
        contentType,
        headers
      });
    } // fn
  }); // responseOrThrow
}
