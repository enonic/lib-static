import type {
  BuildGetterParams,
  BuildGetterParamsWithRoot,
  ParseStringAndOptionsCommonReturnValues
} from '../types';

import {getCacheControlFunc} from '/lib/enonic/static/options/getCacheControlFunc';
import {getContentTypeFunc} from '/lib/enonic/static/options/getContentTypeFunc';
import {verifyAndTrimPathOrRoot} from '/lib/enonic/static/options/verifyAndTrimPathOrRoot';
import {verifyEtagOption} from '/lib/enonic/static/options/verifyEtagOption';


export function parseStringAndOptions<T extends 'path'|'root'>(
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
