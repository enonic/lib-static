// import type { Response } from '/lib/enonic/static/types';

import {
  CACHE_CONTROL_IMMUTEABLE,
  HTTP2_RESPONSE_HEADER_NAME_CACHE_CONTROL,
} from '/lib/enonic/static/constants';


export function getImmuteableHeaders() // : Response['headers']
{
  return {
    [HTTP2_RESPONSE_HEADER_NAME_CACHE_CONTROL]: CACHE_CONTROL_IMMUTEABLE
  };
}
