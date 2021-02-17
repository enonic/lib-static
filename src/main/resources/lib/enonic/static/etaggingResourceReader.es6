const etaggingResourceReader = __.newBean('lib.enonic.libStatic.ETaggingResourceReader');

/** Gets a content string and MD5-contenthash etag string.
 *  In XP prod mode, cache the etag by file path only.
 *  In dev mode, check file's last-modified date. If newer than cached version, re-hash the etag and replace it in the cache.
 *
 * @param path (string) Absolute (i.e. JAR-root-relative) path, name and extension to the file
 * @param isProd (boolean) true for XP prod mode, false for dev mode
 * @return (object) {content, etag}
 */
exports.read = (path, etagOverrideOption) => {
    const output = __.toNativeObject(etaggingResourceReader.read(path, etagOverrideOption));

    log.info(".read output (" +
    	(Array.isArray(output) ?
    		("array[" + output.length + "]") :
    		(typeof output + (output && typeof output === 'object' ? (" with keys: " + JSON.stringify(Object.keys(output))) : ""))
    	) + "): " + JSON.stringify(output, null, 2)
    );

    const[ status, body, etag] = output;

    return {
        status: parseInt(status),
        body,
        etag: etag ? etag : undefined
    }
};
