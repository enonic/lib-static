import type { Resource } from '@enonic-types/lib-io';
import type { Request } from '/lib/enonic/static/types/Request';
import type { Response } from '/lib/enonic/static/types/Response';

export declare type CacheControlResolver = (filePathAndName?: string, resource?: Resource, mimeType?: string) => string | null;

export declare type ContentTypeResolver = (filePathAndName?: string, resource?: Resource) => string | null;

export declare type ContentHashMismatchResponseResolver = (params: {
  contentHash: string;
  contentType: string;
  etag: string;
  resource: Resource;
}) => Response;

declare interface GetParams {
  /**
   * Override the default Cache-Control header value ('public, max-age=31536000, immutable').
   */
  cacheControl?: boolean | string | CacheControlResolver;

  /**
   * Override the built-in MIME type detection.
   */
  contentType?: boolean | string | Record<string, string> | ContentTypeResolver;

  /**
   *  The default behaviour of lib-static is to generate/handle ETag in prod, while skipping it entirely in dev mode.
   *  - Setting the etag parameter to false will turn off etag processing (runtime content processing, headers and
   *    handling) in prod too.
   *  - Setting it to true will turn it on in dev mode too.
   */
  etag?: boolean;

  /**
   * By default, the .get method should not throw errors when used correctly. Instead, it internally server-logs
   * (and hash-ID-tags) errors and automatically outputs a 500 error response.
   *
   * Setting throwErrors to true overrides this: the 500-response generation is skipped, and the error is re-thrown down
   * to the calling context, to be handled there.
   *
   * This does not apply to 400-bad-request and 404-not-found type "errors", they will always generate a 404-response
   * either way. 200 and 304 are also untouched, of course.
   */
  throwErrors?: boolean;
}

export declare interface BuildGetterParams extends GetParams {
  /**
   * The default behaviour of the returned getStatic function is to take a request object, and compare the beginning of
   * the current requested path (request.rawPath) to the endpoint’s own root path (request.contextPath) and get a
   * relative asset path below root (so that later, prefixing the root value to that relative path will give the
   * absolute full path to the resource in the JAR).
   */
  getCleanPath?: (req: Request) => string;
}

export declare type BuildGetterParamsWithRoot = BuildGetterParams & { root: string }

export declare type BuildGetterParamsWithPath = BuildGetterParams & { path: string }

export declare interface ParseStringAndOptionsCommonReturnValues {
  cacheControlFunc?: CacheControlResolver
  contentTypeFunc?: ContentTypeResolver
  errorMessage?: string
  etagOverride?: boolean
  getCleanPath?: (req: Request) => string
  throwErrors: boolean
}
