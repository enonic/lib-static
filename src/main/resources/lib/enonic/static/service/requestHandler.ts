import type {
  CacheControlResolver,
  CacheStrategy,
  ContentTypeResolver,
  EtagProcessing,
  Request,
  UseEtagWhenFn,
} from '/lib/enonic/static/types';

import { getConfiguredCacheStrategy } from '/lib/enonic/static/config';
import { responseOrThrow } from '/lib/enonic/static/response/responseOrThrow';
import { etagRequestHandler } from '/lib/enonic/static/service/etagRequestHandler';
import { immutableRequestHandler } from '/lib/enonic/static/service/immutableRequestHandler';


export function requestHandler({
  cacheStrategy = getConfiguredCacheStrategy(),
  etagCacheControlHeader, // Defaults set in getEtagOrNotModifiedOrNoCacheResponse
  etagProcessing, // Defaults set in getEtagOrNotModifiedOrNoCacheResponse
  getContentType, // Defaults set in etagRequestHandler and immutableRequestHandler
  getImmutableCacheControlHeader, // Defaults set in immutableRequestHandler
  request,
  root,
  throwErrors,
  useEtagWhen // Defaults set in immutableRequestHandler
}: {
  // Required
  request: Request
  // Optional
  cacheStrategy?: CacheStrategy
  etagCacheControlHeader?: string
  etagProcessing?: EtagProcessing
  getContentType?: ContentTypeResolver
  getImmutableCacheControlHeader?: CacheControlResolver
  root?: string
  throwErrors?: boolean
  useEtagWhen?: UseEtagWhenFn
}) {
  return responseOrThrow({
    throwErrors,
    fn: () => {
      if (cacheStrategy === 'etag') {
        return etagRequestHandler({
          etagCacheControlHeader,
          etagProcessing,
          getContentType,
          request,
          root,
          throwErrors
        });
      }

      if (cacheStrategy === 'immutable') {
        return immutableRequestHandler({
          etagCacheControlHeader,
          etagProcessing,
          getContentType,
          getImmutableCacheControlHeader,
          request,
          root,
          throwErrors,
          useEtagWhen
        });
      }

      const msg = `Unsupported cache strategy:${cacheStrategy}`;
      log.error(msg);
      throw new Error('Unsupported cache strategy');
    } // fn
  }); // responseOrThrow
}
