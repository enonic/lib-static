import {GETTER_ROOT} from '/lib/enonic/static/constants';
import {stringStartsWith} from '/lib/enonic/static/util/stringStartsWith';

/**
 * Joins a static-resource `root` with a `path` to produce an absolute
 * resource path that always starts with `/` and has no trailing slash.
 *
 * Canonical form for `path` has no leading slash: `'styles.css'`,
 * `'css/main.css'`. A leading slash is accepted but redundant — both
 * forms resolve identically:
 *
 *   - `'styles.css'`   → `<root>/styles.css`   ← canonical
 *   - `'/styles.css'`  → `<root>/styles.css`
 *   - `''`             → `<root>`              (root itself)
 *   - `'/'`            → `<root>`              (root itself)
 *
 * `root` is treated the same way: a missing leading `/` is added.
 *
 * Throws if `root` is empty or consists only of slashes — for security
 * (see GETTER_ROOT comment below).
 */
export function prefixWithRoot({
  root = GETTER_ROOT,
  path,
}: {
  path: string,
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
