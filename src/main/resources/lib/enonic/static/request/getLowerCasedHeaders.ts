import type {Request} from '@enonic-types/core';

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
