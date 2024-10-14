import type {Request} from '../types'; // Keep this relative for @enonic-types/lib-static to be correct.

import {lcKeys} from '/lib/enonic/static/util/lcKeys';


export function getLowerCasedHeaders({
  request,
}: {
  request: Request
}): object {
  const {
    headers: mixedCaseRequestHeaders = {},
  } = request;

  return lcKeys(mixedCaseRequestHeaders);
}
