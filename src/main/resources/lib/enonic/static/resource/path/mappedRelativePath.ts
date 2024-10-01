import type {Request} from '/lib/enonic/static/types';

import {getRelative} from '/lib/enonic/static/resource/path/getRelative';

export const mappedRelativePath =
  (base: string) =>
  (request: Request): string =>
    getRelative(request).substring(base.length);
