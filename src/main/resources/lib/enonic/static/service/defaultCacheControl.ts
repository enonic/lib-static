import type {CacheControlResolver} from '../types'; // Keep this relative for @enonic-types/lib-static to be correct.

import {
  CONTENT_TYPE,
  RESPONSE_CACHE_CONTROL,
} from '/lib/enonic/static/constants';


export const defaultCacheControl: CacheControlResolver = ({
  contentType,
  path,
  resource: _resource,
}) => {
  if (contentType === CONTENT_TYPE.HTML as string) {
    return RESPONSE_CACHE_CONTROL.PREVENT;
  }

  switch (path) {
    case '/favicon.ico':
    case '/apple-touch-icon.png':
    case '/manifest.json':
    case '/manifest.webmanifest':
    case '/site.webmanifest':
      return RESPONSE_CACHE_CONTROL.SAFE;
    case '/sitemap.xml':
    case '/robots.txt':
      return RESPONSE_CACHE_CONTROL.CRAWLER;
    case '/BingSiteAuth.xml':
      return RESPONSE_CACHE_CONTROL.PREVENT;
  }

  if (path && path.startsWith('/')) {
    if (path.startsWith('/.well-known/')) {
      return RESPONSE_CACHE_CONTROL.SAFE;
    }
  }

  return RESPONSE_CACHE_CONTROL.IMMUTABLE;
}
