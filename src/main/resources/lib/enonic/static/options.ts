import type {
  BuildGetterParams,
  BuildGetterParamsWithRoot
} from '/lib/enonic/static/types';

import {parseStringAndOptions} from '/lib/enonic/static/options/parseStringAndOptions';


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
