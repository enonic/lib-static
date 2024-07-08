import type {
  BuildGetterParams,
  BuildGetterParamsWithRoot,
  Request,
  Response
} from '/lib/enonic/static/types';

import { parseRootAndOptions } from '/lib/enonic/static/options';
import { __getPathError__ } from '/lib/enonic/static/__getPathError__';
import { getResourceOr400 } from '/lib/enonic/static/response/getResourceOr400';
import { getFallbackResourceOr303 } from '/lib/enonic/static/response/getFallbackResourceOr303';
import { getResponse404 } from '/lib/enonic/static/response/getResponse404';
import { getEtagOr304 } from '/lib/enonic/static/response/getEtagOr304';
import { getResponse200 } from '/lib/enonic/static/response/getResponse200';
import { errorLogAndResponse500 } from '/lib/enonic/static/response/errorLogAndResponse500';


const resolvePath = (path) => {
  const rootArr = path.split(/\/+/).filter(i => !!i);
  for (let i=1; i<rootArr.length; i++) {
    if (rootArr[i].endsWith('..')) {
      rootArr.splice(i - 1, 2);
      i -= 2;
    }
  }
  return rootArr.join('/').trim();
}

// Exported for testing only
export const __resolveRoot__ = (root: string) => {
  let resolvedRoot = resolvePath(root.replace(/^\/+/, '').replace(/\/+$/, ''));

  let errorMessage = __getPathError__(resolvedRoot);
  if (!errorMessage) {
    // TODO: verify that root exists and is a directory?
    if (!resolvedRoot) {
      errorMessage = "resolves to the JAR root / empty or all-spaces";
    }
  }
  if (errorMessage) {
    throw Error(`Illegal root argument (or .root option attribute) ${JSON.stringify(root)}: ${errorMessage}`);
  }

  return "/" + resolvedRoot;
};

/* .buildGetter helper: creates a resource path from the request, relative to the root folder (which will be prefixed later).
*  Overridable with the getCleanPath option param. */
const getRelativeResourcePath = (request) => {
  let {rawPath, contextPath} = (request || {});

  let removePrefix = (contextPath || '').trim() || '** missing or falsy **';

  // Normalize: remove leading slashes from both
  rawPath = rawPath.replace(/^\/+/, '');
  removePrefix = removePrefix.replace(/^\/+/, '');

  if (!rawPath.startsWith(removePrefix)) {
    // Gives 500-type error
    throw Error(`Default functionality can't resolve relative asset path: the request was expected to contain a .contextPath string attribute that is a prefix in a .rawPath string attribute. You may need to supply a getCleanPath(request) function parameter to extract a relative asset path from the request. Request: ${JSON.stringify(request)}`);
  }

  return rawPath
    .trim()
    .substring(removePrefix.length)
};

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

  root = __resolveRoot__(root);

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
        ( (relativePath && !relativePath.startsWith('/')) ? '/' : '' ) +
        relativePath;
      log.debug('getStatic: absolutePath: %s', absolutePath);

      const error = __getPathError__(absolutePath);
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
