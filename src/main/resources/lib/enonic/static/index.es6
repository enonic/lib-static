const etagReader = require('/lib/enonic/static/etagReader');
const optionsParser = require('/lib/enonic/static/options');
const ioLib = require('/lib/xp/io');

exports.get = (pathOrOptions, options) => {
    const {
        path,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = optionsParser.parsePathAndOptions(pathOrOptions, options);

    try {
        if (errorMessage) {
            throw Error(errorMessage);
        }

        const { status, error, etagValue } = etagReader.read(path, etagOverride);

        if (status < 300) {
            const resource = ioLib.getResource(path);
            const body = ioLib.readText(resource.getStream());

            const contentType = contentTypeFunc(path, body);

            const headers = {
                'Cache-Control': cacheControlFunc(path, body, contentType),
                'ETag': etagValue
            };

            return {status, body, contentType, headers};

        } else if (status >= 500) {
            // Attempt graceful handling: the status so far comes from the etagReader trying to resolve the etag.
            // In case it's still possible to return the main data with a must-revalidate header - much better than nothing - try to read it:
            try {
                const resource = ioLib.getResource(path);
                const body = ioLib.readText(resource.getStream());

                const contentType = contentTypeFunc(path, body);

                const headers = {
                    'Cache-Control': 'must-revalidate'
                };

                log.warn("Successfully fell back to reading resource '" + path + "' after failing ETag processing (" + error + ")");
                return {status, body, contentType, headers};

            } catch (e) {
                log.warn("Tried reading resource '" + path + "' after failing ETag processing (" + error + ") - but this too failed.");
                throw e;
            }

        } else {
            // An error in the 400-area from the etagReader is bound to yield the same error here, so don't even try a fallback. Just return it.
            return {
                status,
                body: error,
                contentType: "text/plain",
            }
        }

    } catch (e) {
        if (!throwErrors) {
            const errorID = Math.floor(Math.random() * 1000000000000000).toString(36);

            let serverErrorMessage = `lib-static.get, error ID: ${errorID}   |   ${e.message}`;

            if (typeof pathOrOptions === 'string') {
                serverErrorMessage += `  |   path = ${JSON.stringify(pathOrOptions)}`;
                if (options !== undefined) {
                    serverErrorMessage += '   |   options = ' + JSON.stringify(options);
                }

            } else {
                serverErrorMessage += `  |   optionsWithPath = ${JSON.stringify(pathOrOptions)}`;
            }

            log.error(serverErrorMessage);

            return {
                status: 500,
                contentType: "text/plain",
                body: `Server error, logged with error ID: ${errorID}`
            }

        } else {
            throw e;
        }
    }
};


const getPath = (request, root) => {
    // TODO: extract (relative) and verify path from request!!!
    throw Error("NOT IMPLEMENTED");
}

exports.static = (rootOrOptions, options) => {
    const {
        root,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = optionsParser.parseRootAndOptions(rootOrOptions, options);

    if (errorMessage) {
        throw Error(errorMessage);
    }
    // TODO: Catch it good!

    return function get(request) {
        try {

            const path = getPath(request, root);

            const { status, error, etagValue } = etagReader.read(path, etagOverride);

            if (status < 300) {
                const resource = ioLib.getResource(path);
                const body = ioLib.readText(resource.getStream());

                const contentType = contentTypeFunc(path, body);

                const headers = {
                    'Cache-Control': cacheControlFunc(path, body, contentType),
                    'ETag': etagValue
                };

                return {status, body, contentType, headers};

            } else if (status >= 500) {
                // Attempt graceful handling: the status so far comes from the etagReader trying to resolve the etag.
                // In case it's still possible to return the main data with a must-revalidate header - much better than nothing - try to read it:
                try {
                    const resource = ioLib.getResource(path);
                    const body = ioLib.readText(resource.getStream());

                    const contentType = contentTypeFunc(path, body);

                    const headers = {
                        'Cache-Control': 'must-revalidate'
                    };

                    log.warn("Successfully fell back to reading resource '" + path + "' after failing ETag processing (" + error + ")");
                    return {status, body, contentType, headers};

                } catch (e) {
                    log.warn("Tried reading resource '" + path + "' after failing ETag processing (" + error + ") - but this too failed.");
                    throw e;
                }

            } else {
                // An error in the 400-area from the etagReader is bound to yield the same error here, so don't even try a fallback. Just return it.
                return {
                    status,
                    body: error,
                    contentType: "text/plain",
                }
            }

        } catch (e) {
            if (!throwErrors) {
                const errorID = Math.floor(Math.random() * 1000000000000000).toString(36);

                let serverErrorMessage = `lib-static.get, error ID: ${errorID}   |   ${e.message}`;

                if (typeof rootOrOptions === 'string') {
                    serverErrorMessage += `  |   root = ${JSON.stringify(rootOrOptions)}`;
                    if (options !== undefined) {
                        serverErrorMessage += '   |   options = ' + JSON.stringify(options);
                    }

                } else {
                    serverErrorMessage += `  |   optionsWithRoot = ${JSON.stringify(rootOrOptions)}`;
                }

                log.error(serverErrorMessage);

                return {
                    status: 500,
                    contentType: "text/plain",
                    body: `Server error, logged with error ID: ${errorID}`
                }

            } else {
                throw e;
            }
        }
    }

};
