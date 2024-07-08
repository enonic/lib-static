import type {Resource} from '@enonic-types/lib-io';
import type {CacheControlResolver} from '../types';

import {DEFAULT_CACHE_CONTROL} from '/lib/enonic/static/constants';
import {isStringLiteral} from '/lib/enonic/static/private/isStringLiteral';


/**
 * Override-able cache-control-string function creator:
 * Returns a function that takes (path, content, mimeType) arguments and returns a cache-control string.
 *
 * @param cacheControl (string, boolean or function). See README for how the cacheControl option works.
 * */
export const getCacheControlFunc = (cacheControl: string|boolean|CacheControlResolver) => {
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
