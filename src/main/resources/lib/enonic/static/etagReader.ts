const etagService = __.newBean<{
  getEtag: (path: string, etagOverride?: number) => Record<string,string>
}>('lib.enonic.libStatic.etag.EtagService');

/** Gets a content string and MD5-contenthash etag string.
 *  In XP prod mode, cache the etag by file path only.
 *  In dev mode, check file's last-modified date. If newer than cached version, re-hash the etag and replace it in the cache.
 *
 * @param path (string) Absolute path (i.e. JAR-root-relative, with full forward-slash-delimited path, name and extension
 *      to the file, and without app name).
 *      No checking is done here for fine-grained 400, 404 errors etc, so path should be already checked, trimmed,
 *      verified for existing resource etc.
 * @return (object) etag value, if anything was processed, undefined if not.
 * @throws (error) if any error occurred during java processing. Java error message.
 */
export const read = (path: string): string|undefined => {
    const {error, etag} = __.toNativeObject(etagService.getEtag(`${app.name}:${path}`));

    if (error) {
        throw Error(error);
    }

    return etag || undefined
};
