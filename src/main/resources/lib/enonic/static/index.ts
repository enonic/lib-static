import type {
  Request,
  Response
} from './types';
import type {
  BuildGetterParams,
  BuildGetterParamsWithRoot
} from '/lib/enonic/static/options';

import {read} from '/lib/enonic/static/etagReader';
import {
  parsePathAndOptions,
  parseRootAndOptions,
} from '/lib/enonic/static/options';
import {getResource} from '/lib/enonic/static/io';
import {isDev} from '/lib/enonic/static/runMode';
import {INDEXFALLBACK_CACHE_CONTROL} from '/lib/enonic/static/constants';


/////////////////////////////////////////////////////////////////////////////  Response builder functions

const getResponse200 = (
  path: string,
  resource,
  contentTypeFunc,
  cacheControlFunc,
  etag: string|number,
  fallbackPath?: string
) => {
  const contentType = contentTypeFunc(fallbackPath || path, resource);
  const cacheControlHeader = fallbackPath
    ? INDEXFALLBACK_CACHE_CONTROL
    : cacheControlFunc(path, resource, contentType);

  // Preventing any keys under 'header' with null/undefined values (since those cause NPE):
  const headers: Response['headers'] = {};
  if (cacheControlHeader) {
    headers['cache-control'] = cacheControlHeader;
  }
  if (etag) {
    headers.etag = etag;
  }

  return {
    body: resource.getStream(),
    contentType,
    headers,
    status: 200,
  };
};


const getEtagOr304 = (path: string, request, etagOverride?: boolean) => {
    let etag = read(path, etagOverride);

    let ifNoneMatch = (request.headers || {})['If-None-Match'];
    if (ifNoneMatch && ifNoneMatch === etag) {
        return {
            response304: {
                status: 304
            }
        };
    }
    return { etag };
}

/** Creates an easy-readable and trackable error message in the log,
 *  and returns a generic error message with a tracking ID in the response */
const errorLogAndResponse500 = (e, throwErrors, stringOrOptions, options, methodLabel, rootOrPathLabel) => {
    if (!throwErrors) {
        const errorID = Math.floor(Math.random() * 1000000000000000).toString(36);

        let serverErrorMessage = `lib-static.${methodLabel}, error ID: ${errorID}   |   ${e.message}`;

        if (typeof stringOrOptions === 'string') {
            serverErrorMessage += `  |   ${rootOrPathLabel.toLowerCase()} = ${JSON.stringify(stringOrOptions)}`;
            if (options !== undefined) {
                serverErrorMessage += '   |   options = ' + JSON.stringify(options);
            }

        } else {
            serverErrorMessage += `  |   optionsWith${rootOrPathLabel} = ${JSON.stringify(stringOrOptions)}`;
        }

        log.error(serverErrorMessage, e);

        return {
            status: 500,
            contentType: "text/plain; charset=utf-8",
            body: `Server error (logged with error ID: ${errorID})`
        }

    } else {
        throw e;
    }
}


const getResourceOr400 = (
  path: string,
  pathError: string,
  hasTrailingSlash?: boolean
) => {
    if (pathError) {
        if (!isDev()) {
            log.warning(pathError);
        }
        return {
            response400: (isDev())
                ? {
                    status: 400,
                    body: pathError,
                    contentType: 'text/plain; charset=utf-8'
                }
                : {
                    status: 400,
                }
        };
    }


    if (!hasTrailingSlash) {
        const resource = getResource(path);
        if (resource.exists()) {
            return { resource };
        }
    }

    return {};
};

// TODO: if other options than index.html are preferrable or overridable by options later (Issue #57),
//  replace this function at runtime with indexFallbackFunc.
//  Implemented as array in preparation for that.
const getIndexFallbacks = (_path: string) => ['index.html'];

const getFallbackResourceOr303 = (path: string, request, hasTrailingSlash) => {
    const indexFallbacks = getIndexFallbacks(path).map( indexFile =>
        path +
        (!hasTrailingSlash ? '/' : '') +
        indexFile
    );

    for (let i=0; i<indexFallbacks.length; i++) {

        const fallbackPath = indexFallbacks[i];
        const resource = getResource(fallbackPath);

        if (resource.exists()) {
            if (hasTrailingSlash) {
                if (isDev()) {
                    log.info(`Resource fallback for '${path}': returning '${fallbackPath}'`);
                }
                return {
                    res: resource,
                    fallback: fallbackPath
                };

            } else {
                if (isDev()) {
                    log.info(`Not found: '${path}'. However, a fallback exists: '${fallbackPath}'. Redirecting to fetch it from '${request.path}/'.`);
                }
                return {
                    response303: {
                        // Assumes this is the correct redirect, whatever happened in a getCleanPath override
                        redirect: request.path + '/'
                    }
                };
            }
        }
    }

    return {};
}


const getResponse404 = (path: string) => {
    if (!isDev()) {
        log.warning(`Not found: ${JSON.stringify(path)}`);
    }
    return (isDev())
        ? {
            status: 404,
            body: `Not found: ${path}`,
            contentType: 'text/plain; charset=utf-8'
        }
        : {
            status: 404
        }
}

// Very conservative filename verification:
// Actual filenames with these characters are rare and more likely to be attempted attacks.
// For now, easier/cheaper to just prevent them. Revisit this later if necessary.
const doubleDotRx = /\.\./;
const illegalCharsRx = /[<>:"'`´\\|?*]/;
// Exported for testing only
export const __getPathError__ = (trimmedPathString: string): string => {
    if (trimmedPathString.match(doubleDotRx) || trimmedPathString.match(illegalCharsRx)) {
        return "can't contain '..' or any of these characters: \\ | ? * < > ' \" ` ´";
    }
    if (!trimmedPathString) {
        return "resolves to the JAR root / empty or all-spaces";
    }
};

/////////////////////////////////////////////////////////////////////////////  .get

export const get = (pathOrOptions, options) => {

    let {
        path,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = parsePathAndOptions(pathOrOptions, options);


    try {
        if (errorMessage) {
            throw Error(errorMessage);
        }

        path = path.replace(/^\/+/, '');

        let pathError = __getPathError__(path);
        pathError = pathError
            ? `Resource path '${path}' ${pathError}`
            : undefined;

        path = `/${path}`;

        const { resource, response400 } = getResourceOr400(path, pathError);
        if (response400) {
            return response400;
        }
        if (!resource) {
            return getResponse404(path);
        }


        const etag = read(path, etagOverride);

        return getResponse200(path, resource, contentTypeFunc, cacheControlFunc, etag);

    } catch (e) {
        return errorLogAndResponse500(e, throwErrors, pathOrOptions, options, "get", "Path");
    }
};


/////////////////////////////////////////////////////////////////////////////  .buildGetter

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
              // TODO: Since this "only" breaks index fallbacks, consider just logging a warning instead. Or adding some option flag to let users choose if this is warning-level or should cause an error?
              throw Error(`Incoming request.rawPath is: ${JSON.stringify(request.rawPath)}. Even when using getCleanPath in such a way that .rawPath isn't used to resolve resource path, request.rawPath must still be a string for index fallback functionality to work.`);
          }

          const relativePath = getRelativePathFunc(request);

          const absolutePath =
              root +
              ( (relativePath && !relativePath.startsWith('/')) ? '/' : '' ) +
              relativePath;

          const error = __getPathError__(absolutePath);
          const pathError = (error)
              ? `Illegal absolute resource path '${absolutePath}' (resolved relative path: '${relativePath}'): ${error}`      // 400-type error
              : error;

          const hasTrailingSlash = request.rawPath.endsWith('/');

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
