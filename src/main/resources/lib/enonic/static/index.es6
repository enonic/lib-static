const etagReader = require('/lib/enonic/static/etagReader');
const optionsParser = require('/lib/enonic/static/options');
const ioLib = require('/lib/xp/io');


const makeResponse200 = (status, path, contentTypeFunc, cacheControlFunc, etagValue) => {
    const resource = ioLib.getResource(path);
    const body = ioLib.readText(resource.getStream());
    const contentType = contentTypeFunc(path, body);

    const headers = {
        'Cache-Control': cacheControlFunc(path, body, contentType),
        'ETag': etagValue
    };

    return {status, body, contentType, headers};
}


// Attempt graceful handling: the status and etagError so far comes from the etagReader trying to resolve the etag.
// In case it's still possible to return the main data with a must-revalidate header - much better than nothing - try to read it:
const makeFallbackResponse = (status, path, contentTypeFunc, etagError) => {
    try {
        const resource = ioLib.getResource(path);
        const body = ioLib.readText(resource.getStream());
        const contentType = contentTypeFunc(path, body);

        const headers = {
            'Cache-Control': 'must-revalidate'
        };

        log.warn(`Successful fallback to reading resource '${path}', although ETag processing failed (${etagError})`);
        return {status, body, contentType, headers};

    } catch (e) {
        log.warn(`Tried reading resource '${path}' after failing ETag processing (${etagError}) - but this failed too.`);
        throw e;
    }
}


const makeResponse = (status, path, contentTypeFunc, cacheControlFunc, etagValue, etagError) => {
    if (status < 300) {
        return makeResponse200(status, path, contentTypeFunc, cacheControlFunc, etagValue);

    } else if (status >= 500) {
        // Attempt graceful handling: the status and etagError so far comes from the etagReader trying to resolve the etag.
        // In case it's still possible to return the main data with a must-revalidate header - much better than nothing - try to read it:
        return makeFallbackResponse(status, path, contentTypeFunc, etagError);

    } else {
        // An error in the 400-area from the etagReader is bound to yield the same error here, so don't even try a fallback. Just return it.
        return {
            status,
            body: etagError,
            contentType: "text/plain",
        }
    }
}


/** Creates an easy-readable and trackable error message in the log,
 *  and returns a generic error message with a tracking ID in the response */
const makeErrorLogAndResponse = (e, throwErrors, stringOrOptions, options, methodLabel, rootOrPathLabel) => {
    if (!throwErrors) {
        const errorID = Math.floor(Math.random() * 1000000000000000).toString(36);

        let serverErrorMessage = `lib-static.${methodLabel}, error ID: ${errorID}   |   ${e.message}`;

        if (typeof stringOrOptions === 'string') {
            serverErrorMessage += `  |   ${rootOrPathLabel.toLowerCase()} = ${JSON.stringify(stringOrOptions)}`;
            if (options !== undefined) {
                serverErrorMessage += '   |   options = ' + JSON.stringify(options);
            }

        } else {
            serverErrorMessage += `  |   optionsWith${rootOrPathLabel} = ${JSON.stringify(stringOrOptions)}`;
        }

        log.error(serverErrorMessage, e);

        return {
            status: 500,
            contentType: "text/plain",
            body: `Server error, logged with error ID: ${errorID}`
        }

    } else {
        throw e;
    }
}


/* .static helper: creates a path from the request, and prefixes the root */
const getPath = (request, root) => {
    // TODO: extract (relative) and verify path from request!!!
    throw Error("NOT IMPLEMENTED");
}



/////////////////////////////////////////////////////////////////////////////  Entries

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

        return makeResponse(status, path, contentTypeFunc, cacheControlFunc, etagValue, error);

    } catch (e) {
        return makeErrorLogAndResponse(e, throwErrors, pathOrOptions, options, "get", "Path");
    }
};


exports.static = (rootOrOptions, options) => {
    const {
        root,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = optionsParser.parseRootAndOptions(rootOrOptions, options);

    if (!errorMessage) {
        // TODO: Verify valid root - cannot resolve to JAR root or outside JAR
    }
    if (errorMessage) {
        return makeErrorLogAndResponse(Error(errorMessage), throwErrors, rootOrOptions, options, "static", "Root");
    }

    return function getStatic(request) {
        try {

            const path = getPath(request, root);

            const { status, error, etagValue } = etagReader.read(path, etagOverride);

            return makeResponse(status, path, contentTypeFunc, cacheControlFunc, etagValue, error);

        } catch (e) {
            return makeErrorLogAndResponse(e, throwErrors, rootOrOptions, options, "static", "Root");
        }
    }
};
