import { read } from '/lib/enonic/static/etagReader';
import { parsePath } from '/lib/enonic/static/path/parsePath';
import { prefixWithRoot } from '/lib/enonic/static/resource/path/prefixWithRoot';


// Can be vhosted... so we don't care about the url, just the resource path.
export function getStaticPath({
  relResourcePath, // relative to the root
  root,
}: {
  relResourcePath: string
  root?: string
}): string {
  const absResourcePathWithoutTrailingSlash = prefixWithRoot({
    path: relResourcePath,
    root
  });

  const etagWithDblQuotes = read(absResourcePathWithoutTrailingSlash);

  if (!etagWithDblQuotes) { // Dev mode
    return relResourcePath
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
  } = parsePath({ path: relResourcePath.replace(/\/$/, '') })

  return `${dir}${filename}-${etagWithoutQuotes}${ext ? `.${ext}` : ''}`;
}

// export function getStaticServiceUrl({
//   application = app.name,
//   path,
//   root = GETTER_ROOT,
// }: {
//   application?: string
//   branchId?: string
//   path: string
//   root?: string
// }): string {
//   return `/_/service/${application}/${root}/${path}`;
// }

// export function getStaticSiteUrl({
//   application = app.name,
//   branchId = 'master',
//   path,
//   repoId,
//   root = GETTER_ROOT,
//   site,
// }: {
//   application?: string
//   branchId?: string
//   path: string
//   repoId: string
//   root?: string
//   site?: string
// }): string {
//   return `${site ? `${site}/`: ''}${repoId}/${branchId}/_/service/${application}/${root}/${path}`;
// }
