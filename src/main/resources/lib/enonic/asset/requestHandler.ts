import type { Request } from '/lib/enonic/static/types/Request';
import type { Response } from '/lib/enonic/static/types/Response';

import {
  HTTP2_RESPONSE_HEADER,
  RESPONSE_CACHE_CONTROL_DIRECTIVE,
  RESPONSE_NOT_MODIFIED,
} from '/lib/enonic/static/constants';
import { read } from '/lib/enonic/static/etagReader';
import {
  getMimeType,
  getResource,
} from '/lib/enonic/static/io';
import { getIfNoneMatchHeader } from '/lib/enonic/static/request/getIfNoneMatchHeader';
import { checkPath } from '/lib/enonic/static/resource/path/checkPath';
import { getAbsoluteResourcePathWithoutTrailingSlash } from '/lib/enonic/static/resource/path/getAbsoluteResourcePathWithoutTrailingSlash';
import {
  notFoundResponse,
  okResponse
} from '/lib/enonic/static/response/responses';
import { isDev } from '/lib/enonic/static/runMode';
import { getFingerprint } from '/lib/enonic/static/runMode';


export function requestHandler({
  request
}: {
  request: Request
}): Response {
  const fingerprint = getFingerprint(app.name);
  if (fingerprint && request.rawPath.endsWith(`/${fingerprint}`)) {
    request.rawPath.replace(`/${fingerprint}`, '');
  }

  const absResourcePathWithoutTrailingSlash = getAbsoluteResourcePathWithoutTrailingSlash({
    request,
    root: '/assets' // TODO config?
  });

  const errorResponse = checkPath({ absResourcePathWithoutTrailingSlash });
  if (errorResponse) {
    return errorResponse;
  }

  const resource = getResource(absResourcePathWithoutTrailingSlash);

  if (!resource.exists()) {
    return notFoundResponse();
  }

  const contentType = getMimeType(absResourcePathWithoutTrailingSlash)

  if(isDev()) {
    return okResponse({
      body: resource.getStream(),
      contentType,
      headers: {
        [HTTP2_RESPONSE_HEADER.CACHE_CONTROL]: RESPONSE_CACHE_CONTROL_DIRECTIVE.NO_STORE
      }
    });
  }

  const etagWithDblFnutts = read(absResourcePathWithoutTrailingSlash);
  const ifNoneMatchRequestHeader = getIfNoneMatchHeader({ request })
  if (
    ifNoneMatchRequestHeader
    && ifNoneMatchRequestHeader === etagWithDblFnutts
  ) {
    return RESPONSE_NOT_MODIFIED;
  }

  return okResponse({
    body: resource.getStream(),
    contentType,
    headers: {
      [HTTP2_RESPONSE_HEADER.ETAG]: etagWithDblFnutts
    }
  });
} // function requestHandler
