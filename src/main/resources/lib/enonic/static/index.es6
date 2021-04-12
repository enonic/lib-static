const etagReader = require('/lib/enonic/static/etagReader');
const optionsParser = require('/lib/enonic/static/options');
const ioLib = require('/lib/enonic/static/io');
const runMode = require('/lib/enonic/static/runMode');

const getResponse200 = (path, resource, contentTypeFunc, cacheControlFunc, etag) => {
    const contentType = contentTypeFunc(path, resource);
    const cacheControlHeader = cacheControlFunc(path, resource, contentType);

    // Preventing any keys under 'header' with null/undefined values (since those cause NPE):
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
            body: `Server error (logged with error ID: ${errorID})`
        }

    } else {
        throw e;
    }
}



const getResourceOr400 = (path, pathError) => {
    if (pathError) {
        if (!runMode.isDev()) {
            log.warning(pathError);
        }
        return {
            response400: (runMode.isDev())
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
        if (!runMode.isDev()) {
            log.warning(`Not found: ${path}`);
        }
        return {
            response400: (runMode.isDev())
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



// Very conservative filename verification:
// Actual filenames with these characters are rare and more likely to be attempted attacks.
// For now, easier/cheaper to just prevent them. Revisit this later if necessary.
const doubleDotRx = /\.\./;
const illegalCharsRx = /[<>:"'`´\\|?*]/;
// Exported for testing only
exports.__getPathError__ = (trimmedPathString) => {
    if (trimmedPathString.match(doubleDotRx) || trimmedPathString.match(illegalCharsRx)) {
        return "can't contain '..' or any of these characters: \\ | ? * < > ' \" ` ´";
    }
    if (!trimmedPathString) {
        return "resolves to the JAR root / empty or all-spaces";
    }
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
        const pathError = exports.__getPathError__(path);

        path = `/${path}`;

        const { resource, response400 } = getResourceOr400(path, pathError ? `Resource path '${path}' ${pathError}` : undefined);
        if (response400) {
            return response400;
        }


        const etag = etagReader.read(path, etagOverride);

        return getResponse200(path, resource, contentTypeFunc, cacheControlFunc, etag);

    } catch (e) {
        return errorLogAndResponse500(e, throwErrors, pathOrOptions, options, "get", "Path");
    }
};


/////////////////////////////////////////////////////////////////////////////  .buildGetter

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

/* .buildGetter helper: creates a resource path from the request, relative to the root folder (which will be prefixed later).
*  Overridable with the getCleanPath option param. */
const getRelativeResourcePath = (request) => {
    let {rawPath, contextPath} = (request || {});

    if (!rawPath) {
        throw Error(`Default functionality can't resolve relative asset path: the request doesn't have a .rawPath attribute. You may need to supply a getCleanPath(request) function parameter to extract a relative asset path from the request. Request: ${JSON.stringify(request)}`);
    }

    let removePrefix = (contextPath || '').trim() || '** missing or falsy **';

    // Normalize: remove leading slashes from both
    rawPath = rawPath.replace(/^\/+/, '');
    removePrefix = removePrefix.replace(/^\/+/, '');

    if (!rawPath.startsWith(removePrefix)) {
        // Gives 500-type error
        throw Error(`Default functionality can't resolve relative asset path: the request was expected to contain a .contextPath string attribute that is a prefix in a .rawPath string attribute. You may need to supply a getCleanPath(request) function parameter to extract a relative asset path from the request. Request: ${JSON.stringify(request)}`);
    }

    return rawPath
        .trim()
        .substring(removePrefix.length)
}



// Exported for testing only
exports.__resolveRoot__ = (root) => {
    let resolvedRoot = resolvePath(root.replace(/^\/+/, '').replace(/\/+$/, ''));
    let errorMessage = exports.__getPathError__(resolvedRoot);
    resolvedRoot = "/" + resolvedRoot;

    if (!errorMessage) {
        // TODO: verify that root exists and is a directory?
        if (!resolvedRoot) {
            errorMessage = "resolves to the JAR root / empty or all-spaces";
        }
    }

    if (errorMessage) {
        throw Error(`Illegal root argument (or .root option attribute) ${JSON.stringify(root)}: ${errorMessage}`);
    }

    return resolvedRoot;
};


exports.buildGetter = (rootOrOptions, options) => {
    let {
        root,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        getCleanPath,
        throwErrors,
        errorMessage
    } = optionsParser.parseRootAndOptions(rootOrOptions, options);

    if (errorMessage) {
        throw Error(errorMessage);
    }

    root = exports.__resolveRoot__(root, errorMessage);

    // Allow option override of the function that gets the relative resource path from the request
    const getRelativePathFunc = getCleanPath || getRelativeResourcePath;

    return function getStatic(request) {
        try {
            const relativePath = getRelativePathFunc(request)
                .replace(/^\/+/, '');

            const error = exports.__getPathError__(relativePath);
            const pathError = (error)
                ? `Illegal relative resource path '${relativePath}': ${error}`      // 400-type error
                : error;


            const absolutePath = `${root}/${relativePath}`;

            const { resource, response400 } = getResourceOr400(absolutePath, pathError);
            if (response400) {
                return response400;
            }

            const { etag, response304 } = getEtagOr304(absolutePath, request, etagOverride);
            if (response304) {
                return response304
            }

            return getResponse200(absolutePath, resource, contentTypeFunc, cacheControlFunc, etag);

        } catch (e) {
            return errorLogAndResponse500(e, throwErrors, rootOrOptions, options, "buildGetter#getStatic", "Root");
        }
    }
};
