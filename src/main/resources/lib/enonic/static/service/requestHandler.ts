import type {RequestHandler} from '/lib/enonic/static/types';

import {
  CONTENT_CODING,
  CONTENT_ENCODING,
  HTTP2_REQUEST_HEADER,
  HTTP2_RESPONSE_HEADER,
  RESPONSE_CACHE_CONTROL,
  VARY,
} from '/lib/enonic/static/constants';
import {read} from '/lib/enonic/static/etagReader';
import {getResource} from '/lib/enonic/static/io';
import {getMimeType} from '/lib/enonic/static/io';
import {responseOrThrow} from '/lib/enonic/static/response/responseOrThrow';
import {getRelativeResourcePath} from '/lib/enonic/static/path/getRelativeResourcePath';
import {webAppCacheControl} from '/lib/enonic/static/service/webAppCacheControl';
import {
  badRequestResponse,
  movedPermanentlyResponse,
  notFoundResponse,
  notModifiedResponse,
  okResponse,
} from '/lib/enonic/static/response/responses';
import {prefixWithRoot} from '/lib/enonic/static/resource/path/prefixWithRoot';
import {checkPath} from '/lib/enonic/static/resource/path/checkPath';
import {isDev} from '/lib/enonic/static/runMode';
import {stringEndsWith} from '/lib/enonic/static/util/stringEndsWith';
import {stringIncludes} from '/lib/enonic/static/util/stringIncludes';
import {getLowerCasedHeaders} from '/lib/enonic/static/request/getLowerCasedHeaders';


export const requestHandler: RequestHandler = ({
  cacheControl: cacheControlFn = webAppCacheControl,
  contentType: contentTypeFn = ({path}) => getMimeType(path),
  etag = true,
  index = 'index.html',
  relativePath: relativePathFn = getRelativeResourcePath,
  request,
  root,
  staticCompress = true,
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
              contentType: 'text/plain; charset=utf-8',
            });
          }
          log.warning(msg);
          return badRequestResponse();
        }
        if (stringEndsWith(request.rawPath, '/')) {
          request.rawPath += index;
        } else {
          indexAndNoTrailingSlash = true;
        }
      } // if index

      const relativePath = relativePathFn(request);

      const absResourcePathWithoutTrailingSlash = prefixWithRoot({
        path: relativePath,
        root,
      });

      const errorResponse = checkPath({absResourcePathWithoutTrailingSlash});
      if (errorResponse) {
        return errorResponse;
      }

      let resource = getResource(absResourcePathWithoutTrailingSlash);

      if (indexAndNoTrailingSlash && !resource.exists()) {
        request.rawPath += `/${index}`;
        const indexAbsPath = prefixWithRoot({
          path: relativePathFn(request),
          root,
        });
        const indexResource = getResource(indexAbsPath);
        if (indexResource.exists()) {
          if(!request.path) {
            const msg = `Invalid request without path: ${JSON.stringify(request)}! request.path is needed when index is enabled and the request path does not end with a slash.`;
            if(isDev()) {
              return badRequestResponse({
                body: msg,
                contentType: 'text/plain; charset=utf-8',
              });
            }
            log.warning(msg);
            return badRequestResponse();
          }
          return movedPermanentlyResponse({
            location: `${request.path}/`,
          });
        }
      }

      if (!resource.exists()) {
        return notFoundResponse();
      }

      const contentType = contentTypeFn({
        path: absResourcePathWithoutTrailingSlash,
        resource,
      });

      if(isDev()) {
        return okResponse({
          body: resource.getStream(),
          contentType,
          headers: {
            [HTTP2_RESPONSE_HEADER.CACHE_CONTROL]: RESPONSE_CACHE_CONTROL.DEV,
          },
        });
      }

      // Production
      const headers = {
        [HTTP2_RESPONSE_HEADER.CACHE_CONTROL]: cacheControlFn({
          contentType,
          path: relativePath,
          resource,
        }),
      };

      if (staticCompress) {
        headers[HTTP2_RESPONSE_HEADER.VARY] = VARY.ACCEPT_ENCODING;
      }

      const lowerCasedRequestHeaders = getLowerCasedHeaders({request});

      let etagWithDblFnutts: string;
      if (etag) {
        etagWithDblFnutts = read(absResourcePathWithoutTrailingSlash);
        const ifNoneMatchRequestHeader = lowerCasedRequestHeaders[HTTP2_REQUEST_HEADER.IF_NONE_MATCH];
        headers[HTTP2_RESPONSE_HEADER.ETAG] = etagWithDblFnutts;
        if (
          ifNoneMatchRequestHeader
          && ifNoneMatchRequestHeader === etagWithDblFnutts
        ) {
          return notModifiedResponse({
            headers,
          });
        }
      }

      const trimmedAndLowercasedAcceptEncoding: string = (lowerCasedRequestHeaders[HTTP2_REQUEST_HEADER.ACCEPT_ENCODING] as string | undefined || '')
        .trim()
        .toLowerCase();

        if (staticCompress && trimmedAndLowercasedAcceptEncoding) {

        if (
          stringIncludes(trimmedAndLowercasedAcceptEncoding, CONTENT_CODING.BR)
          && !stringIncludes(trimmedAndLowercasedAcceptEncoding, `${CONTENT_CODING.BR};q=0,`)
          && !stringEndsWith(trimmedAndLowercasedAcceptEncoding, `${CONTENT_CODING.BR};q=0`)
        ) {
            const resourceBr = getResource(`${absResourcePathWithoutTrailingSlash}.br`);
            if (resourceBr.exists()) {
              headers[HTTP2_RESPONSE_HEADER.CONTENT_ENCODING] = CONTENT_ENCODING.BR;
              if (etagWithDblFnutts) {
                headers[HTTP2_RESPONSE_HEADER.ETAG] = etagWithDblFnutts.replace(/"$/, '-br"');
              }
              resource = resourceBr;
            }
          } // brotli

          if (
            !headers[HTTP2_RESPONSE_HEADER.CONTENT_ENCODING] // prefer brotli
            && stringIncludes(trimmedAndLowercasedAcceptEncoding, CONTENT_CODING.GZIP)
            && !stringIncludes(trimmedAndLowercasedAcceptEncoding, `${CONTENT_CODING.GZIP};q=0,`)
            && !stringEndsWith(trimmedAndLowercasedAcceptEncoding, `${CONTENT_CODING.GZIP};q=0`)
          ) {
            const resourceGz = getResource(`${absResourcePathWithoutTrailingSlash}.gz`);
            if (resourceGz.exists()) {
              headers[HTTP2_RESPONSE_HEADER.CONTENT_ENCODING] = CONTENT_ENCODING.GZIP;
              if (etagWithDblFnutts) {
                headers[HTTP2_RESPONSE_HEADER.ETAG] = etagWithDblFnutts.replace(/"$/, '-gzip"');
              }
              resource = resourceGz;
            }
          } // gzip

      } // if doStaticCompression && acceptEncoding

      return okResponse({
        body: resource.getStream(),
        contentType,
        headers,
      });
    }, // fn
  }); // responseOrThrow
}
