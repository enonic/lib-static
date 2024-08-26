import { read } from '/lib/enonic/static/etagReader';
import { parsePath } from '/lib/enonic/static/path/parsePath';
import { prefixWithRoot } from '/lib/enonic/static/resource/path/prefixWithRoot';


// Can be vhosted... so we don't care about the url, just the resource path.
export function getStaticPath({
  path, // relative to the root
  root,
}: {
  path: string
  root?: string
}): string {
  const absResourcePathWithoutTrailingSlash = prefixWithRoot({
    path: path,
    root
  });

  const etagWithDblQuotes = read(absResourcePathWithoutTrailingSlash);

  if (!etagWithDblQuotes) { // Dev mode
    return path
      // Remove trailing slash, so it behaves similar to prod mode
      .replace(/\/$/, '');
  }

  // Must be after the truthy check above
  const etagWithoutQuotes = etagWithDblQuotes
    .replace(/^"/, '')
    .replace(/"$/, '');

  const {
    dir,
    ext,
    filename
  } = parsePath({ path: path.replace(/\/$/, '') })

  return `${dir}${filename}-${etagWithoutQuotes}${ext ? `.${ext}` : ''}`;
}
