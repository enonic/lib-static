import { parseFilename } from '/lib/enonic/static/path/parseFilename';


export function parsePath({
  path
}: {
  path: string
}) {
  if (!path) {
    return {
      dir: '',
      ext: '',
      filename: '',
    };
  }

  const lastSlashI = path.lastIndexOf('/');

  if (lastSlashI === -1) { // No folder, just file
    const {
      ext,
      filename
    } = parseFilename({
      filename: path
    });
    return {
      dir: '',
      ext,
      filename,
    };
  }

  const {
    ext,
    filename
  } = parseFilename({
    filename: path.slice(lastSlashI + 1)
  });

  return {
    dir: path.slice(0, lastSlashI + 1)
      .replace(/\/\/+/g, '/'), // Replace multiple slashes with a single slash
    ext,
    filename,
  };
}
