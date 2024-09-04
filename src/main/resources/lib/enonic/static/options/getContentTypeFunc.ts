import type {Resource} from '@enonic-types/lib-io';
import type {ContentTypeResolverPositional} from '/lib/enonic/static/types';

import {getMimeType} from '/lib/enonic/static/io';
import {isFunction} from '/lib/enonic/static/util/isFunction';
import {isStringLiteral} from '/lib/enonic/static/util/isStringLiteral';


/**
 * Override-able MIME-type function creator:
 * Returns a function that takes a path argument and returns a mime type.
 *
 * @param contentType (string, boolean, function or object). See README for how the contentType option works.
 * */
export const getContentTypeFunc = (contentType: string|boolean|ContentTypeResolverPositional|Record<string,string>): ContentTypeResolverPositional => {
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
