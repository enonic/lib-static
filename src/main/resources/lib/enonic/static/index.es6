const ioLib = require('/lib/xp/io');
const runMode = require('./runmode');


const DEFAULT_CACHE_CONTROL = 'public, max-age=31536000, immutable';

const getPathErrorMessage = path => {
    if (typeof path !== 'string') {
        if (path) {
            return `First argument (pathOrOptions), or the path attribute in it, is of unexpected type '${Array.isArray(path) ? "array" : typeof path}'. Expected: string or object.`;
        } else {
            return "First argument (pathOrOptions), or the path attribute in it, is missing.";
        }
    }

    if (!path.trim()) {
        return "First argument (pathOrOptions), or the path attribute in it, is empty or all-spaces.";
    }
    return null;
}



const parsePathAndOptions = (pathOrOptions, options) => {
    let path, useOptions, errorMessage;

    // Argument overloading: pathOrOptions can be the only argument - an optionsWithPath object - in which case a path attribute must be included in it.
    if (pathOrOptions && typeof pathOrOptions === 'object') {
        errorMessage = Array.isArray(pathOrOptions)
            ? "First argument (pathOrOptions) is of unexpected type 'array'. Expected: string or object."
            : getPathErrorMessage(pathOrOptions.path);
        if (!errorMessage) {
            path = pathOrOptions.path.trim();
        }
        useOptions = pathOrOptions

    // But if the first argument doesn't exist as an object, it could be a valid path string. Verify and maybe use that.
    } else {
        errorMessage = getPathErrorMessage(pathOrOptions);
        if (!errorMessage) {
            path = pathOrOptions.trim();
        }
        const isArray = Array.isArray(options);
        if (!options || (typeof options === 'object' && !isArray)) {
            useOptions = options || {};
        } else {
            if (!errorMessage) {
                errorMessage = `Second argument (options) is if unexpected type '${isArray ? "array" : typeof options}'. Expected: object.`;
            }
            useOptions = {};
        }
    }

    return { path, useOptions, errorMessage };
}





/**
 * Override-able cache-control-string function creator:
 * Returns a function that takes (path, content) arguments and returns a cache-control string.
 *
 * @param contentType (string, boolean or function). See README for how the contentType option works.
 * */
const getCacheControlFunc = (cacheControl) => {
                                                                                                                        /*
                                                                                                                        if (cacheControl || cacheControl === false || cacheControl === '') {
                                                                                                                            log.info("cacheControl (" +
                                                                                                                                (Array.isArray(cacheControl) ?
                                                                                                                                        ("array[" + cacheControl.length + "]") :
                                                                                                                                        (typeof cacheControl + (cacheControl && typeof cacheControl === 'object' ? (" with keys: " + JSON.stringify(Object.keys(cacheControl))) : ""))
                                                                                                                                ) + "): " + JSON.stringify(cacheControl, null, 2)
                                                                                                                            );
                                                                                                                        }
                                                                                                                        //*/

    if (cacheControl === false || cacheControl === '') {
        // Override: explicitly switch off with false or empty string
        return () => undefined;
    }

    if (cacheControl === undefined || cacheControl === true || cacheControl === null) {
        // Ignoring other absent/no-override values
        return () => DEFAULT_CACHE_CONTROL;
    }

    const argType = typeof cacheControl;

    if (argType === 'string') {
        return () => cacheControl;
    }

    if (argType === 'function') {
        return (path, content, mimeType) => {
            const result = cacheControl(path, content, mimeType);
            if (result === null) {
                return DEFAULT_CACHE_CONTROL;
            }
            return result;
        }
    }

    throw Error(`Unexpected type for the 'cacheControl' option: ${Array.isArray(cacheControl) ? "array" : typeof cacheControl}. Expected: string, boolean or function.`);
}





/**
 * Override-able MIME-type function creator:
 * Returns a function that takes a path argument and returns a mime type.
 *
 * @param contentType (string, function or object). See README for how the contentType option works.
 * */
const getContentTypeFunc = (contentType) => {
    if (contentType || contentType === '') {
                                                                                                                        /*
                                                                                                                        log.info("contentType (" +
                                                                                                                            (Array.isArray(contentType) ?
                                                                                                                                ("array[" + contentType.length + "]") :
                                                                                                                                (typeof contentType + (contentType && typeof contentType === 'object' ? (" with keys: " + JSON.stringify(Object.keys(contentType))) : ""))
                                                                                                                            ) + "): " + JSON.stringify(contentType, null, 2)
                                                                                                                        );
                                                                                                                        //*/

        const argType = typeof contentType;

        if (argType === 'string') {
            return () => contentType || undefined;
        }
        if (argType === 'function') {
            return contentType;
        }
        if (argType === 'object' && !Array.isArray(contentType)) {
            // Replace all keys with lowercase-without-dots versions, for predictability
            Object.keys(contentType).forEach(key => {
                const newKey = key.toLowerCase().trim('.');
                if (newKey !== key) {
                    const val = contentType[key];
                    delete contentType[key];
                    contentType[newKey] = val;
                }
            });

            return (path) => {
                const lowerPath = path.toLowerCase();
                Object.keys(contentType).forEach(key => {
                    if (lowerPath.endsWith(key)) {
                        return contentType[key];
                    }
                })
                return ioLib.getMimeType(path);
            }
        }

        throw Error(`Unexpected type for the 'contentType' option: ${Array.isArray(contentType) ? "array" : typeof contentType}. Expected: string, object or function.`);
    }

    return ioLib.getMimeType;
}



/**
 * Switch for etag functionality.
 * If etag is not set, it will be true in XP prod mode and false in dev mode.
 * If overridden here with true, it will be true in both modes, and vice versa with false.
 * @param etag
 * @returns true, false or null - null will signify that it should dep
 */
const getEtagFlag = (etag) => {
    if (etag === true || etag === false) {
        return etag;
    }

    // Any other existent
    if (etag !== undefined) {
        throw Error(`Unexpected type for the 'etag' option ${JSON.stringify({etag})}: ${Array.isArray(etag) ? "array" : typeof etag}. Expected: boolean.`);
    }

                                                                                                                        /*
                                                                                                                        log.info("etag (" +
                                                                                                                            (Array.isArray(etag) ?
                                                                                                                                    ("array[" + etag.length + "]") :
                                                                                                                                    (typeof etag + (etag && typeof etag === 'object' ? (" with keys: " + JSON.stringify(Object.keys(etag))) : ""))
                                                                                                                            ) + "): " + JSON.stringify(etag, null, 2)
                                                                                                                        );
                                                                                                                        //*/
    return runMode.isProd();
};


exports.get = (pathOrOptions, options) => {
    const { path, useOptions, errorMessage } = parsePathAndOptions(pathOrOptions, options);

    const throwErrors = useOptions.throwErrors;

    try {
        if (errorMessage) {
            throw Error(errorMessage
                + ` pathOrOptions = ${JSON.stringify(pathOrOptions)}`
                + ((options !== undefined)
                    ? ', options = ' + JSON.stringify(options)
                    : '')
            );
        }

        const {
            cacheControl,
            contentType,
            etag
        } = useOptions;

        const cacheControlFunc = getCacheControlFunc(cacheControl);
        const contentTypeFunc = getContentTypeFunc(contentType);

        const makeEtag = getEtagFlag(etag);
        // TODO: what to do with etag when true

        const res = ioLib.getResource(path);
        const exists = res.exists();

        if (exists) {
            const content = ioLib.readText(res.getStream());
            const mimeType = contentTypeFunc(path, content);

            return {
                status: 200,
                headers: {
                    'Cache-Control': cacheControlFunc(path, content, mimeType)
                },
                contentType: mimeType,
                body: content
            };

        } else {
            return {
                status: 404,
                contentType: "text/plain",
                body: `Resource not found: '${path}'`
            }
        }

    } catch (e) {
        if (!throwErrors) {
            const errorID = Math.floor(Math.random() * 1000000000000000).toString(36);
            log.error(`lib-static.get, error ID: ${errorID}   |   ${e.message}`);

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
