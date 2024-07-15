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
 * @param etagOverrideOption (boolean?) By default (undefined/null...), etag will be processed in XP dev mode runtime
 *      but skipped in XP prod mode. etagOverrideOption=true enforces etag processing in XP dev mode too,
 *      while false turns etag processing completely off.
 * @return (object) etag value, if anything was processed, undefined if not.
 * @throws (error) if any error occurred during java processing. Java error message.
 */
export const read = (path: string, etagOverrideOption?: boolean): string|undefined => {
    // true: 1, false: -1, other: 0
    const etagOverride = (etagOverrideOption)
        ? 1
        : etagOverrideOption === false
            ? -1
            : 0;
    log.debug('read: etagOverride: %s', etagOverride);

    const { error, etag } = __.toNativeObject(etagService.getEtag(`${app.name}:${path}`, etagOverride));
    log.debug('read: error: %s', error);
    log.debug('read: etag: %s', etag);

    if (error) {
        throw Error(error);
    }

    return etag || undefined
};
