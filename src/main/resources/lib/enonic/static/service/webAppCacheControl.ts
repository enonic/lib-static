import type {
  CacheControlResolver,
} from '/lib/enonic/static/types';

import {
  CONTENT_TYPE,
  RESPONSE_CACHE_CONTROL,
} from '/lib/enonic/static/constants';


export const webAppCacheControl: CacheControlResolver = ({
  contentType,
  path,
  resource: _resource,
}) => {
  if (contentType === CONTENT_TYPE.HTML) {
    return RESPONSE_CACHE_CONTROL.PREVENT;
  }

  switch (path) {
    case '/favicon.ico':
    case '/manifest.json':
      return RESPONSE_CACHE_CONTROL.SAFE;
    case '/sitemap.xml':
    case '/robots.txt':
      return RESPONSE_CACHE_CONTROL.CRAWLER;
    case '/BingSiteAuth.xml':
      return RESPONSE_CACHE_CONTROL.PREVENT;
  }

  if (path && path.startsWith('/')) {
    if(path.endsWith('.webmanifest')) {
      return RESPONSE_CACHE_CONTROL.SAFE;
    }
    if (path.startsWith('/.well-known/')) {
      return RESPONSE_CACHE_CONTROL.EDGE;
    }
  }

  return RESPONSE_CACHE_CONTROL.IMMUTABLE;
}