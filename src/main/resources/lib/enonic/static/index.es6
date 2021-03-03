const etagReader = require('/lib/enonic/static/etagReader');
const optionsParser = require('/lib/enonic/static/options');
const ioLib = require('/lib/xp/io');


const makeResponse200 = (status, path, contentTypeFunc, cacheControlFunc, etagValue) => {
    const resource = ioLib.getResource(path);

    const contentType = contentTypeFunc(path, resource);

    const headers = {
        'Cache-Control': cacheControlFunc(path, resource, contentType),
        'ETag': etagValue
    };

    return {
        status,
        body: resource.getStream(),
        contentType,
        headers
    };
}


// Attempt graceful handling: the status and etagError so far comes from the etagReader trying to resolve the etag.
// In case it's still possible to return the main data with a must-revalidate header - much better than nothing - try to read it:
const makeFallbackResponse = (status, path, contentTypeFunc, etagError) => {
    try {
        const resource = ioLib.getResource(path);

        const contentType = contentTypeFunc(path, resource);

        const headers = {
            'Cache-Control': 'must-revalidate'
        };

        log.warn(`Successful fallback to reading resource '${path}', although ETag processing failed (${etagError})`);
        return {
            status,
            body: resource.getStream(),
            contentType,
            headers
        };

    } catch (e) {
        log.error(`Tried reading resource '${path}' after failing ETag processing (${etagError}) - but this failed too.`, e);
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





/////////////////////////////////////////////////////////////////////////////  .get

exports.get = (pathOrOptions, options) => {

    let {
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

        path = path.replace(/^\/+/, '');
        const pathError = getPathError(path);
        if (pathError) {
            return {
                status: 400,
                body: `Resource path '${path}' ${pathError}`,
                contentType: 'text/plain'
            }
        }
        path = `/${path}`;


        const { status, error, etagValue } = etagReader.read(path, etagOverride);

        return makeResponse(status, path, contentTypeFunc, cacheControlFunc, etagValue, error);

    } catch (e) {
        return makeErrorLogAndResponse(e, throwErrors, pathOrOptions, options, "get", "Path");
    }
};


/////////////////////////////////////////////////////////////////////////////  .static

const resolvePath = (path) => {
    const rootArr = path.split(/\/+/).filter(i => !!i);
    for (let i=1; i<rootArr.length; i++) {
        if (rootArr[i].endsWith('..')) {
            rootArr.splice(i - 1, 2);
            i -= 2;
        }
    }
    return rootArr.join('/').trim();
}

/* .static helper: creates a path from the request, and prefixes the root */
const getPathFromRequest = (request, root, contextPathOverride) => {
    const removePrefix = contextPathOverride || request.contextPath || '** contextPath (contextPathOverride) IS MISSING IN BOTH REQUEST AND OPTIONS **';

    if (request.path.startsWith(removePrefix)) {
        const relativePath = request.path
            .trim()
            .substring(removePrefix.length)
            .replace(/^\/+/, '');

        const error = getPathError(relativePath);

        return (error)
            ? {
                pathError: `Illegal relative resource path '${relativePath}': ${error}`    // 400-type error
            }
            : {
                path: `${root}/${relativePath}`
            };
    }

    // 500-type error
    throw Error(`options.contextPathOverride || request.contextPath = '${removePrefix}'. Expected that to be the prefix of request.path '${request.path}'. Add or correct options.contextPathOverride so that it matches the request.path URI root (which is removed from request.path to create the relative asset path).`);
}


// Very conservative filename verification:
// Actual filenames with these characters are rare and more likely to be attempted attacks.
// For now, easier/cheaper to just prevent them. Revisit this later if necessary.
const doubleDotRx = /\.\./;
const illegalCharsRx = /[<>:"'`´\\|?*]/;
const getPathError = (trimmedPathString) => {
    if (trimmedPathString.match(doubleDotRx) || trimmedPathString.match(illegalCharsRx)) {
        return "can't contain '..' or any of these characters: \\ | ? * < > ' \" ` ´";
    }
    if (!trimmedPathString) {
        return "is empty or all-spaces";
    }
};
exports.getPathError = getPathError;


exports.static = (rootOrOptions, options) => {
    let {
        root,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        contextPathOverride,
        throwErrors,
        errorMessage
    } = optionsParser.parseRootAndOptions(rootOrOptions, options);

    if (!errorMessage) {
        root = root.replace(/^\/+/, '');
        errorMessage = getPathError(root);
    }
    if (!errorMessage) {
        root = resolvePath(root);
        // TODO: verify that root exists and is a directory?
        if (!root) {
            errorMessage = "is empty or all-spaces";
        }
        root = "/" + root;
    }

    if (errorMessage) {
        errorMessage = `Illegal root argument (or .root option attribute) '${root}': ${errorMessage}`;
    }


    if (errorMessage) {
        throw Error(errorMessage);
    }

    return function getStatic(request) {
        try {
            const { path, pathError }  = getPathFromRequest(request, root, contextPathOverride);
            if (pathError) {
                return {
                    status: 400,
                    body: pathError,
                    contentType: 'text/plain'
                }
            }

            const { etagValue, status, error } = etagReader.read(path, etagOverride);

            let ifNoneMatch = (request.headers || {})['If-None-Match'];
            if (ifNoneMatch && ifNoneMatch === etagValue) {
                return {
                    status: 304
                };
            }

            return makeResponse(status, path, contentTypeFunc, cacheControlFunc, etagValue, error);

        } catch (e) {
            return makeErrorLogAndResponse(e, throwErrors, rootOrOptions, options, "static", "Root");
        }
    }
};
