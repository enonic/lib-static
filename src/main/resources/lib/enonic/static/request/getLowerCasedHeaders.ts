import type { Request } from '/lib/enonic/static/types';

import { lcKeys } from '/lib/enonic/static/util/lcKeys';


export function getLowerCasedHeaders({
  request
}: {
  request: Request
}) {
  const {
    headers: mixedCaseRequestHeaders = {},
  } = request;

  return lcKeys(mixedCaseRequestHeaders);
}
