import type {
  BuildGetterParams,
  BuildGetterParamsWithRoot,
  Request,
  Response
} from '/lib/enonic/static/types';

import { parseRootAndOptions } from '/lib/enonic/static/options';
import { getPathError } from '/lib/enonic/static/path/getPathError';
import { getRelativeResourcePath } from '/lib/enonic/static/path/getRelativeResourcePath';
import { resolveRoot } from '/lib/enonic/static/path/resolveRoot';
import { getResourceOr400 } from '/lib/enonic/static/response/getResourceOr400';
import { getFallbackResourceOr303 } from '/lib/enonic/static/response/getFallbackResourceOr303';
import { getResponse404 } from '/lib/enonic/static/response/getResponse404';
import { getEtagOr304 } from '/lib/enonic/static/response/getEtagOr304';
import { getResponse200 } from '/lib/enonic/static/response/getResponse200';
import { errorLogAndResponse500 } from '/lib/enonic/static/response/errorLogAndResponse500';


/**
 * Sets up and returns a reusable resource-getter function.
 */
export function buildGetter(root: string, params?: BuildGetterParams): (req: Request) => Response;
export function buildGetter(params: BuildGetterParamsWithRoot): (req: Request) => Response;
export function buildGetter(rootOrOptions: string|BuildGetterParamsWithRoot, options?: BuildGetterParams) {
  let {
    root,
    cacheControlFunc,
    contentTypeFunc,
    etagOverride,
    getCleanPath,
    throwErrors,
    errorMessage
  } = parseRootAndOptions(rootOrOptions, options);

  if (errorMessage) {
    throw Error(errorMessage);
  }

  root = resolveRoot(root);

  // Allow option override of the function that gets the relative resource path from the request
  const getRelativePathFunc = getCleanPath || getRelativeResourcePath;

  return function getStatic(request: Request): Response {
    try {
      if (typeof request.rawPath !== 'string') {
          // request.rawPath is the only way to determine whether the incoming URL had a trailing slash or not
          // - which is necessary for any index fallback functionality to work (and also depends on XP 7.7.1 and above
          // - before this, trailing slashes were always stripped from rawPath as well).
          // TODO: Since this "only" breaks index fallbacks, consider just logging a warning instead.
          // Or adding some option flag to let users choose if this is warning-level or should cause an error?
          throw Error(`Incoming request.rawPath is: ${JSON.stringify(request.rawPath)}. Even when using getCleanPath in such a way that .rawPath isn't used to resolve resource path, request.rawPath must still be a string for index fallback functionality to work.`);
      }

      const relativePath = getRelativePathFunc(request);
      log.debug('getStatic: relativePath: %s', relativePath);

      const absolutePath =
        root +
        /* c8 ignore next */ // Probably not possible to create such a path in Enonic XP
        ( (relativePath && !relativePath.startsWith('/')) ? '/' : '' ) +
        relativePath;
      log.debug('getStatic: absolutePath: %s', absolutePath);

      const error = getPathError(absolutePath);
      log.debug('getStatic: error: %s', error);

      const pathError = (error)
        ? `Illegal absolute resource path '${absolutePath}' (resolved relative path: '${relativePath}'): ${error}` // 400-type error
        : error;
      log.debug('getStatic: pathError: %s', pathError);

      const hasTrailingSlash = request.rawPath.endsWith('/');
      log.debug('getStatic: hasTrailingSlash: %s', hasTrailingSlash);

      let { resource, response400 } = getResourceOr400(absolutePath, pathError, hasTrailingSlash);
      if (response400) {
        return response400;
      }

      let fallbackPath: string;
      if (!resource) {
        const { res, fallback, response303 } = getFallbackResourceOr303(absolutePath, request, hasTrailingSlash);
        // NOTE: Logging binaries is a bad idea
        // log.debug('getStatic: res:%s fallback:%s response303:%s', JSON.stringify(res, null, 4), fallback, JSON.stringify(response303, null, 4));

        if (response303) {
          return response303;
        }

        resource = res;
        if (!resource) {
          return getResponse404(absolutePath);
        }

        fallbackPath = fallback;
      }
      log.debug('getStatic: fallbackPath: %s', fallbackPath);

      const { etag, response304 } = getEtagOr304(fallbackPath || absolutePath, request, etagOverride);
      if (response304) {
        return response304
      }

      return getResponse200(absolutePath, resource, contentTypeFunc, cacheControlFunc, etag, fallbackPath);

    } catch (e) {
      return errorLogAndResponse500(e, throwErrors, rootOrOptions, options, "buildGetter#getStatic", "Root");
    }
  }
}
