const etagReader = require('/lib/enonic/static/etagReader');
const optionsParser = require('/lib/enonic/static/options');
const ioLib = require('/lib/enonic/static/io');

var IS_DEV = Java.type('com.enonic.xp.server.RunMode').get().toString() !== 'PROD';

const getResponse200 = (path, resource, contentTypeFunc, cacheControlFunc, etag) => {
    const contentType = contentTypeFunc(path, resource);
    const cacheControlHeader = cacheControlFunc(path, resource, contentType);

    // Preventing any keys at all with null/undefined values in header (since those cause NPE):
    const headers = {};
    if (cacheControlHeader) {
        headers['Cache-Control'] = cacheControlHeader;
    }
    if (etag) {
        headers.ETag = etag;
    }

    return {
        status: 200,
        body: resource.getStream(),
        contentType,
        headers
    };
};


const getEtagOr304 = (path, request, etagOverride) => {
    let etag = etagReader.read(path, etagOverride);

    let ifNoneMatch = (request.headers || {})['If-None-Match'];
    if (ifNoneMatch && ifNoneMatch === etag) {
        return {
            response304: {
                status: 304
            }
        };
    }
    return { etag };
}

/** Creates an easy-readable and trackable error message in the log,
 *  and returns a generic error message with a tracking ID in the response */
const errorLogAndResponse500 = (e, throwErrors, stringOrOptions, options, methodLabel, rootOrPathLabel) => {
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
            contentType: "text/plain; charset=utf-8",
            body: `Server error, logged with error ID: ${errorID}`
        }

    } else {
        throw e;
    }
}



const getResourceOr400 = (path, pathError) => {
    if (pathError) {
        // TODO: In prod mode, the pathError will just be swallowed. Log it?
        return {
            response400: (IS_DEV)
                ? {
                    status: 400,
                    body: pathError,
                    contentType: 'text/plain; charset=utf-8'
                }
                : {
                    status: 400,
                }
        };
    }

    const resource = ioLib.getResource(path);
    if (!resource.exists()) {
        return {
            response400: (IS_DEV)
                ? {
                    status: 404,
                    body: `Not found: ${path}`,
                    contentType: 'text/plain; charset=utf-8'
                }
                : {
                    status: 404
                }
        }
    }

    return { resource };
};



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

        const { resource, response400 } = getResourceOr400(path, pathError ? `Resource path '${path}' ${pathError}` : undefined);
        if (response400) {
            return response400;
        }

        path = `/${path}`;

        const etag = etagReader.read(path, etagOverride);

        return getResponse200(path, resource, contentTypeFunc, cacheControlFunc, etag);

    } catch (e) {
        return errorLogAndResponse500(e, throwErrors, pathOrOptions, options, "get", "Path");
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

    if (request.rawPath.startsWith(removePrefix)) {
        const relativePath = request.rawPath
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
    throw Error(`options.contextPathOverride || request.contextPath = '${removePrefix}'. Expected that to be the prefix of request.rawPath '${request.rawPath}'. Add or correct options.contextPathOverride so that it matches the request.rawPath URI root (which is removed from request.rawPath to create the relative asset path).`);
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
        root = resolvePath(root.replace(/^\/+/, ''));
        errorMessage = getPathError(root);
        root = "/" + root;
    }
    if (!errorMessage) {
        // TODO: verify that root exists and is a directory?
        if (!root) {
            errorMessage = "is empty or all-spaces";
        }
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

            const { resource, response400 } = getResourceOr400(path, pathError);
            if (response400) {
                return response400;
            }

            const { etag, response304 } = getEtagOr304(path, request, etagOverride);
            if (response304) {
                return response304
            }

            return getResponse200(path, resource, contentTypeFunc, cacheControlFunc, etag);

        } catch (e) {
            return errorLogAndResponse500(e, throwErrors, rootOrOptions, options, "static", "Root");
        }
    }
};
