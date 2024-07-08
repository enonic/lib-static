import type {Resource} from '@enonic-types/lib-io';
import type {Request} from './types';

import {getMimeType} from '/lib/enonic/static/io';
import {DEFAULT_CACHE_CONTROL} from '/lib/enonic/static/constants';
import {isFunction} from '/lib/enonic/static/private/isFunction';
import {isStringLiteral} from '/lib/enonic/static/private/isStringLiteral';


export type CacheControlResolver = (filePathAndName?: string, resource?: Resource, mimeType?: string) => string | null;

export type ContentTypeResolver = (filePathAndName?: string, resource?: Resource) => string | null;

export interface GetParams {
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

const verifyEtagOption = (etag) => {
    if (etag !== true && etag !== false && etag !== undefined) {
        throw Error("Unexpected 'etag' option: only true, false or undefined are allowed.");
    }
};




export const errorMessageTemplateFirstArgumentMissing = (label: 'path'|'root') =>
  `First argument (${label}OrOptions), or the ${label} attribute in it, is missing (or falsy)`;

// Verify that path or root is a string, and not empty (label is 'path' or 'root')
const verifyAndTrimPathOrRoot = (
  pathOrRoot: string|BuildGetterParamsWithRoot,
  label: 'path'|'root'
) => {
    if (typeof pathOrRoot !== 'string') {
        if (pathOrRoot) {
            throw Error(`First argument (${label}OrOptions), or the ${label} attribute in it, is of unexpected type '${Array.isArray(pathOrRoot) ? "array" : typeof pathOrRoot}'. Expected: string or object.`);
        } else {
            throw Error(errorMessageTemplateFirstArgumentMissing(label));
        }
    }
    return pathOrRoot.trim();
}




/**
 * Override-able cache-control-string function creator:
 * Returns a function that takes (path, content, mimeType) arguments and returns a cache-control string.
 *
 * @param cacheControl (string, boolean or function). See README for how the cacheControl option works.
 * */
const getCacheControlFunc = (cacheControl: string|boolean|CacheControlResolver) => {
  if (cacheControl === false || cacheControl === '') {
    // Override: explicitly switch off with false or empty string
    return () => undefined;
  }

  if (cacheControl === undefined || cacheControl === true) {
    // Ignoring other absent/no-override values
    return () => DEFAULT_CACHE_CONTROL;
  }

  if (isStringLiteral(cacheControl)) {
    return () => cacheControl.trim() || undefined;
  }

  const argType = typeof cacheControl;
  if (argType === 'function') {
    return (path?: string, resource?: Resource, mimeType?: string) => {
      const result = cacheControl(path, resource, mimeType);
      if (result === null) {
        return DEFAULT_CACHE_CONTROL;
      }
      return result;
    }
  }

  throw Error(`Unexpected type for the 'cacheControl' option: '${Array.isArray(cacheControl) ? "array" : typeof cacheControl}'. Expected: string, boolean or function.`);
}





/**
 * Override-able MIME-type function creator:
 * Returns a function that takes a path argument and returns a mime type.
 *
 * @param contentType (string, boolean, function or object). See README for how the contentType option works.
 * */
const getContentTypeFunc = (contentType: string|boolean|ContentTypeResolver|Record<string,string>): ContentTypeResolver => {
  if (contentType === false) {
    return () => undefined;
  }

  if (contentType === true || contentType === undefined) {
    return getMimeType;
  }

  if (contentType || contentType === '') {

    if (isStringLiteral(contentType)) {
      return () => contentType.trim() || undefined;
    }

    if (isFunction(contentType)) {
      return (path?: string, resource?: Resource) => {
        const result = contentType(path, resource);
        if (result === null) {
          return getMimeType(path);
        }
        return result;
      }
    }

    const argType = typeof contentType;
    if (argType === 'object' && !Array.isArray(contentType)) {
      // Replace all keys with lowercase-without-dots versions, for predictability
      Object.keys(contentType).forEach(key => {
        const newKey = key.toLowerCase().replace(/^\.+|\.+$/, '');
        const val = contentType[key];
        delete contentType[key];
        contentType["." + newKey] = val;
      });

      return (path: string) => {
        const lowerPath = path.toLowerCase();
        for (let key of Object.keys(contentType)) {
          if (lowerPath.endsWith(key)) {
            return contentType[key];
          }
        }

        return getMimeType(path);
      }
    }
  }

  throw Error(`Unexpected type for the 'contentType' option: '${Array.isArray(contentType) ? "array" : typeof contentType}'. Expected: string, object or function.`);
}

interface ParseStringAndOptionsCommonReturnValues {
  cacheControlFunc?: CacheControlResolver
  contentTypeFunc?: ContentTypeResolver
  errorMessage?: string
  etagOverride?: boolean
  getCleanPath?: (req: Request) => string
  throwErrors: boolean
}

function parseStringAndOptions<T extends 'path'|'root'>(
  stringOrOptions: string|BuildGetterParamsWithRoot,
  options: BuildGetterParams,
  attributeKey: 'path'|'root'
): ParseStringAndOptionsCommonReturnValues & (
  T extends 'path'
    ? {path?: string} // TODO not optional, code should be refactored
    : {root?: string} // TODO not optional, code should be refactored
) {
  let pathOrRoot: string,
      useOptions: BuildGetterParams,
      throwErrors: boolean = undefined;

  try {
      // Argument overloading: stringOrOptions can be the only argument - an optionsWithRoot/optionsWithPath object - in which case a root/path
      // attribute must be included in it. If it is an object, then any other arguments after that are irrelevant:
      if (stringOrOptions && typeof stringOrOptions === 'object') {
          if (Array.isArray(stringOrOptions)) {
              throwErrors = !!(options || {}).throwErrors;
              throw Error(`First argument (${attributeKey}OrOptions) is of unexpected type 'array'. Expected: string or object.`);
          }
          throwErrors = !!stringOrOptions.throwErrors;
          pathOrRoot = verifyAndTrimPathOrRoot(stringOrOptions[attributeKey], attributeKey);
          useOptions = stringOrOptions

          // But if the first argument isn't a (truthy) object, it could also be a valid root/path string. Verify and maybe use that,
          // and if so, look for and use a second object as options:
      } else {
          const isArray = Array.isArray(options);
          if (!options || (typeof options === 'object' && !isArray)) {
              useOptions = options || {};
              throwErrors = !!useOptions.throwErrors;

          } else {
              throw Error(`Second argument (options) is if unexpected type '${isArray ? "array" : typeof options}'. Expected: object.`);
          }

          pathOrRoot = verifyAndTrimPathOrRoot(stringOrOptions, attributeKey);
      }

      const {
          cacheControl,
          contentType,
          etag,
          getCleanPath
      } = useOptions;

      const cacheControlFunc = getCacheControlFunc(cacheControl);
      const contentTypeFunc = getContentTypeFunc(contentType);

      if (getCleanPath !== undefined && typeof getCleanPath !== 'function') {
          throw Error(`Unexpected type of 'getCleanPath' parameter: '${typeof getCleanPath}'. Expected a function. getCleanPath is: ${JSON.stringify(getCleanPath)}`);
      }

      verifyEtagOption(etag);

      const output = {
          cacheControlFunc,
          contentTypeFunc,
          throwErrors,
          getCleanPath,
          etagOverride: etag
      };
      output[attributeKey] = pathOrRoot;

      return output;

  } catch (e) {
      return {
          throwErrors,
          errorMessage: e.message
      };
  }
}





//////////////////////////////////////////////////////////  Entries



/** ENTRY: type-verifies and parses the path and options for index.js.get.
 *  - If everything's okay, the path string will be extracted from the options object (.path attribute) or pathOrOptions as a first string argument,
 *  and the rest of the options parsed into the returned object: { path, etagOverride, cacheControlFunc, contentTypeFunc, throwErrors }.
 *
 *  - If something is malformed or causes other error, does not throw an error, but returns an object { errorMessage, throwErrors }.
 *
 *  May return a throwErrors boolean (undefined by default but overridable as an option).
 *    - If true, enforces that any errors should be rethrown further up and caught by calling context / XP's own error handler system
 *    - If falsy, runtime errors will just be logged and a 500 status returned.
 *
 * @param pathOrOptions {string|object} Path string, or an object that contains at least a path attribute and may contain other options - same as next parameter below.
 * @param options {{
 *                  contentType: (string|boolean|object|function(path, resource): string)?,
 *                  cacheControl: (string|boolean|function(path, resource, mimeType): string)?,
 *                  getCleanPath: (function: string)?,
 *                  etag: (boolean?),
 *                  throwErrors: (boolean?)
 *           }} Options object (only applies if pathOrOptions is a string). Any path string here will be ignored.
 * @return {
 *      {
 *          path: (string),
 *          etagOverride: (boolean?),
 *          cacheControlFunc: (function(path, resource, mimeType): string),
 *          contentTypeFunc: (function(path, resource): string),
 *          getCleanPath: (function: string)?,
 *          throwErrors: (boolean)
 *      } | {
 *          errorMessage: string,
 *          throwErrors: boolean
 *      }
 *  }
 */
export const parsePathAndOptions = (pathOrOptions, options) =>
    parseStringAndOptions<'path'>(pathOrOptions, options, 'path');



/** ENTRY: type-verifies and parses the root and options for index.js.buildGetter.
 *  - If everything's okay, the root string will be extracted from the options object (.root attribute) or rootOrOptions as a first string argument,
 *  and the rest of the options parsed into the returned object: { root, etagOverride, cacheControlFunc, contentTypeFunc, throwErrors }.
 *
 *  - If something is malformed or causes other error, does not throw an error, but returns an object { errorMessage, throwErrors }.
 *
 *  May return a throwErrors boolean (undefined by default but overridable as an option).
 *    - If true, enforces that any errors should be rethrown further up and caught by calling context / XP's own error handler system
 *    - If falsy, runtime errors will just be logged and a 500 status returned.
 *
 * @param rootOrOptions {string|object} Root string, or an object that contains at least a root attribute and may contain other options - same as next parameter below.
 * @param options {{
 *                  contentType: (string|boolean|object|function(path, resource): string)?,
 *                  cacheControl: (string|boolean|function(path, resource, mimeType): string)?,
 *                  getCleanPath: (function: string)?,
 *                  etag: (boolean?),
 *                  throwErrors: (boolean?)
 *           }} Options object (only applies if rootOrOptions is a string). Any root string here will be ignored. NOTE: the contentType and cacheControl functions should take full path params for each individual resource, not just root. The same applies to the returned cacheControlFunc and contentTypeFunc - exactly like with index.js.get.
 * @return {
 *      {
 *          root: (string),
 *          etagOverride: (boolean?),
 *          cacheControlFunc: (function(path, resource, mimeType): string),
 *          contentTypeFunc: (function(path, resource): string),
 *          getCleanPath: (function: string)?,
 *          throwErrors: (boolean)
 *      } | {
 *          errorMessage: string,
 *          throwErrors: boolean
 *      }
 *  }
 */
export const parseRootAndOptions = (rootOrOptions: string|BuildGetterParamsWithRoot, options?: BuildGetterParams) =>
  parseStringAndOptions<'root'>(rootOrOptions, options, 'root');
