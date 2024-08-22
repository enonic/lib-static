import type {
  Request,
} from '/lib/enonic/static/types';

import { getRelativeResourcePath } from '/lib/enonic/static/path/getRelativeResourcePath';
import { prefixWithRoot } from '/lib/enonic/static/resource/path/prefixWithRoot';


export function getAbsoluteResourcePathWithoutTrailingSlash({
  request,
  root // default is set and checked in prefixWithRoot
}: {
  request: Request
  root?: string
}) {
  const relResourcePath = getRelativeResourcePath(request);
  log.debug('handleResourceRequest: relFilePath: %s', relResourcePath);

  return prefixWithRoot({
    path: relResourcePath,
    root
  });
}
