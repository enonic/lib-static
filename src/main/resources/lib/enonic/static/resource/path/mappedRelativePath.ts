import type {Request} from '/lib/enonic/static/types';

import {getRelative} from '/lib/enonic/static/resource/path/getRelative';
import {isStringLiteral} from '/lib/enonic/static/util/isStringLiteral';
import {stringStartsWith} from '/lib/enonic/static/util/stringStartsWith';

export const mappedRelativePath =
  (base: string) =>
  (request: Request): string => {
    if (!isStringLiteral(base)) {
      throw new Error(`mappedRelativePath: Base must be a string! base: ${JSON.stringify(base, null, 4)}`);
    }
    const baseWithoutSurroundingSlashes = base.replace(/^\/+/, '').replace(/\/+$/, '');
    if (!baseWithoutSurroundingSlashes) {
      throw new Error(`mappedRelativePath: Base path can't be empty! base: "${base}"`);
    }
    const slashBase = `/${baseWithoutSurroundingSlashes}`;
    const rel = getRelative(request);
    if (!stringStartsWith(rel, slashBase)) {
      throw new Error(`mappedRelativePath: Relative path does not start with base path: ${rel} vs ${slashBase}`);
    }
    return `${rel.substring(slashBase.length)}/`;
  }
