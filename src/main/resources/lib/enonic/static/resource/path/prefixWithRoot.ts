import {GETTER_ROOT} from '/lib/enonic/static/constants';
import {stringStartsWith} from '/lib/enonic/static/util/stringStartsWith';

export function prefixWithRoot({
  root = GETTER_ROOT,
  path,
}: {
  path: string, // Empty, a slash, or a path with or without a leading slash — all accepted.
  root?: string
}): string {
  // NOTE: For security reasons it's very important that GETTER_ROOT is the root
  // of the path, or all resources could be exposed.
  if (!root || root.replace(/\/+/g, '') === '') {
    const errorMessage = `prefixWithRoot: root must be a non-empty string! root: "${root}"`;
    log.error(errorMessage);
    throw new Error(errorMessage);
  }
  const slashRoot = stringStartsWith(root, '/') ? root : `/${root}`;
  const slashPath = stringStartsWith(path, '/') ? path : `/${path}`;
  return `${slashRoot}${slashPath}`
    .replace(/\/$/, ''); // Remove trailing slash
}
