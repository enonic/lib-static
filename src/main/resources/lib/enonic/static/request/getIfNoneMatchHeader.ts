import type { Request } from '/lib/enonic/static/types';


import { HTTP2_REQUEST_HEADER_IF_NONE_MATCH } from '/lib/enonic/static/constants';
import { getLowerCasedHeaders } from '/lib/enonic/static/request/getLowerCasedHeaders';


export function getIfNoneMatchHeader({
  request
}: {
  request: Request
}) {
  const lowerCasedRequestHeaders = getLowerCasedHeaders({ request });
  log.debug('getIfNoneMatchHeader lowerCasedRequestHeaders: %s', JSON.stringify(lowerCasedRequestHeaders, null, 4));

  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-None-Match
  // TODO support list? If-None-Match: "<etag_value>", "<etag_value>", …
  return lowerCasedRequestHeaders[HTTP2_REQUEST_HEADER_IF_NONE_MATCH];
}
