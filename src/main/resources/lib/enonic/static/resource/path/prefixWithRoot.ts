import {GETTER_ROOT} from '/lib/enonic/static/constants';


export function prefixWithRoot({
  root = GETTER_ROOT,
  path,
}: {
  path: string, // Can be empty string, or just a slash, or a full path starting with a slash
  root?: string
}): string {
  // NOTE: For security reasons it's very important that GETTER_ROOT is the root
  // of the path, or all resources could be exposed.
  if (!root || root.replace(/\/+/g, '') === '') {
    const errorMessage = `prefixWithRoot: root must be a non-empty string! root: "${root}"`;
    log.error(errorMessage);
    throw new Error(errorMessage);
  }
  const slashRoot = root.startsWith('/') ? root : `/${root}`;
  return `${slashRoot}${path}`
    .replace(/\/$/, ''); // Remove trailing slash
}
