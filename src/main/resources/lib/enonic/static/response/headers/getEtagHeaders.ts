// import type { Response } from '/lib/enonic/static/types';

import {
  CACHE_CONTROL_NO_CACHE,
  HTTP2_RESPONSE_HEADER_NAME_CACHE_CONTROL,
  HTTP2_RESPONSE_HEADER_NAME_ETAG,
} from '/lib/enonic/static/constants';


export function getEtagHeaders({
  etagWithDblFnutts
}: {
  etagWithDblFnutts?: string
}) // : Response['headers']
{
  const headers /* : Response['headers'] */ = {
    [HTTP2_RESPONSE_HEADER_NAME_CACHE_CONTROL]: CACHE_CONTROL_NO_CACHE
  };
  if (etagWithDblFnutts) { // No etag's in dev mode
    headers[HTTP2_RESPONSE_HEADER_NAME_ETAG] = etagWithDblFnutts;
  }
  return headers;
}
