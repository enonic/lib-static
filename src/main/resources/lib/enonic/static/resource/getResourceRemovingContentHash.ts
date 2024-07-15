import { getResource } from '/lib/xp/io';


export function getResourceRemovingContentHash({
  absResourcePathWithoutTrailingSlash
}: {
  absResourcePathWithoutTrailingSlash: string
}) {
  const lastSlashI = absResourcePathWithoutTrailingSlash.lastIndexOf('/');

  // There is always a slash since GETTER_ROOT is part of the path
  const resourceDir = absResourcePathWithoutTrailingSlash.substring(0, lastSlashI);
  log.debug('resourceDir: %s', resourceDir);

  const resourceFilenameWithEtagAndExt = absResourcePathWithoutTrailingSlash.substring(lastSlashI + 1);
  log.debug('resourceFilenameWithEtagAndExt: %s', resourceFilenameWithEtagAndExt);

  const lastDotI = resourceFilenameWithEtagAndExt.lastIndexOf('.'); // Could be -1
  const ext = resourceFilenameWithEtagAndExt.substring(lastDotI + 1);
  log.debug('ext: %s', ext);

  const filenameWithoutExt = resourceFilenameWithEtagAndExt.substring(0, lastDotI);
  log.debug('filenameWithoutExt: %s', filenameWithoutExt);

  const lastDashI = filenameWithoutExt.lastIndexOf('-');

  const contentHashFromFilename = filenameWithoutExt.substring(lastDashI + 1);
  log.debug('contentHashFromFilename: %s', contentHashFromFilename);

  const filenameWithoutEtag = filenameWithoutExt.substring(0, lastDashI);
  log.debug('filenameWithoutEtag: %s', filenameWithoutEtag);

  const absoluteResourcePathWithoutContentHash = `${resourceDir}/${filenameWithoutEtag}.${ext}`;
  return {
    absoluteResourcePathWithoutContentHash,
    contentHashFromFilename,
    // NOTE: Resource might not exist though which is handedled elsewhere :)
    resourceWithContentHashRemoved: getResource(absoluteResourcePathWithoutContentHash)
  };
}
