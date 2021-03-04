const etagService = __.newBean('lib.enonic.libStatic.etag.EtagService');


/** Gets a content string and MD5-contenthash etag string.
 *  In XP prod mode, cache the etag by file path only.
 *  In dev mode, check file's last-modified date. If newer than cached version, re-hash the etag and replace it in the cache.
 *
 * @param path (string) Absolute (i.e. JAR-root-relative) path, name and extension to the file. No checking is done here
 *      for fine-grained 400, 404 errors etc, so path should be already checked, trimmed, verified for existing resource etc.
 * @param isProd (boolean) true for XP prod mode, false for dev mode
 * @return (object) {content, etag}
 */
exports.read = (path, etagOverrideOption) => {
    // true: 1, false: -1, other: 0
    const etagOverride = (etagOverrideOption)
        ? 1
        : etagOverrideOption === false
            ? -1
            : 0;

    let { error, etag } = __.toNativeObject(etagService.getEtag(`${app.name}:${path}`, etagOverride));

    if (error) {
        throw Error(error);
    }

    return (etag && etag[0] !== '"')
        ? `"${etag}"`
        : etag || undefined
};
