const ioLib = require('/lib/xp/io');

const DEFAULT_MAX_AGE = 31536000;

exports.DEFAULT_CACHE_CONTROL_FIELDS = [
    "public",
    "max-age=" + DEFAULT_MAX_AGE,
    "immutable"
];

const DEFAULT_CACHE_CONTROL = exports.DEFAULT_CACHE_CONTROL_FIELDS.join(", ");
exports.DEFAULT_CACHE_CONTROL = DEFAULT_CACHE_CONTROL;

const verifyEtagOption = (etag) => {
    if (etag !== true && etag !== false && etag !== undefined) {
        throw Error("Unexpected 'etag' option: only true, false or undefined are allowed.");
    }
};





const verifyPath = path => {
    if (typeof path !== 'string') {
        if (path) {
            throw Error(`First argument (pathOrOptions), or the path attribute in it, is of unexpected type '${Array.isArray(path) ? "array" : typeof path}'. Expected: string or object.`);
        } else {
            throw Error("First argument (pathOrOptions), or the path attribute in it, is missing.");
        }
    }

    if (!path.trim()) {
        throw Error("First argument (pathOrOptions), or the path attribute in it, is empty or all-spaces.");
    }
}




/**
 * Override-able cache-control-string function creator:
 * Returns a function that takes (path, content, mimeType) arguments and returns a cache-control string.
 *
 * @param cacheControl (string, boolean or function). See README for how the cacheControl option works.
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

    throw Error(`Unexpected type for the 'cacheControl' option: '${Array.isArray(cacheControl) ? "array" : typeof cacheControl}'. Expected: string, boolean or function.`);
}





/**
 * Override-able MIME-type function creator:
 * Returns a function that takes a path argument and returns a mime type.
 *
 * @param contentType (string, boolean, function or object). See README for how the contentType option works.
 * */
const getContentTypeFunc = (contentType) => {
    if (contentType === false) {
        return () => undefined;
    }
    if (contentType === true || contentType === undefined) {
        return ioLib.getMimeType;
    }
    if (contentType || contentType === '') {
        const argType = typeof contentType;

        if (argType === 'string') {
            return () => contentType.trim() || undefined;
        }

        if (argType === 'function') {
            return (path) => {
                const result = contentType(path);
                if (result === null) {
                    return ioLib.getMimeType(path);
                }
                return result;
            }
        }
        if (argType === 'object' && !Array.isArray(contentType)) {
            // Replace all keys with lowercase-without-dots versions, for predictability
            Object.keys(contentType).forEach(key => {
                const newKey = key.toLowerCase().replace(/^\.+|\.+$/, '');
                const val = contentType[key];
                delete contentType[key];
                contentType["." + newKey] = val;
            });

            return (path) => {
                const lowerPath = path.toLowerCase();
                for (let key of Object.keys(contentType)) {
                    if (lowerPath.endsWith(key)) {
                        return contentType[key];
                    }
                }
                return ioLib.getMimeType(path);
            }
        }
    }

    throw Error(`Unexpected type for the 'contentType' option: '${Array.isArray(contentType) ? "array" : typeof contentType}'. Expected: string, object or function.`);
}




/** ENTRY: type-verifies and parses the path and options.
 *  - If evereything's okay, the path string will be extracted from the options object (.path attribute) or pathOrOptions as a first string argument,
 *  and the rest of the options parsed into the returned object: { path, etagOverride, cacheControlFunc, contentTypeFunc, throwErrors }.
 *
 *  - If something is malformed or causes other error, does not throw an error, but returns an object { errorMessage, throwErrors }.
 *
 *  May return a throwErrors boolean (undefined by default but overridable as an option).
 *    - If true, enforces that any errors should be rethrown further up and caught by calling context / XP's own error handler system
 *    - If falsy, runtime errors will just be logged and a 500 status returned.
 *
 * @param pathOrOptions {string|object} Path string, or an object that contains at least a path attribute and may contain other options - same as next parameter below.
 * @param options {{
 *                  contentType: (string|boolean|object|function(path): string)?,
 *                  cacheControl: (string|boolean|function(path, content, mimeType): string)?,
 *                  etag: (boolean?),
 *                  throwErrors: (boolean?)
 *           }} Options object (only applies if pathOrOptions is a string). Any path string here will be ignored.
 * @return {
 *      {
 *          path: (string),
 *          etagOverride: (boolean?),
 *          cacheControlFunc: (function(path, content, mimeType): string),
 *          contentTypeFunc: (function(path, content): string),
 *          throwErrors: (boolean)
 *      } | {
 *          errorMessage: string,
 *          throwErrors: boolean
 *      }
 *  }
 */
exports.parsePathAndOptions = (pathOrOptions, options) => {
    let path,
        useOptions,
        throwErrors = undefined;

    try {
        // Argument overloading: pathOrOptions can be the only argument - an optionsWithPath object - in which case a path
        // attribute must be included in it. If it is an object, then any other arguments after that are irrelevant:
        if (pathOrOptions && typeof pathOrOptions === 'object') {
            if (Array.isArray(pathOrOptions)) {
                throw Error("First argument (pathOrOptions) is of unexpected type 'array'. Expected: string or object.");
            }
            throwErrors = !!pathOrOptions.throwErrors;
            verifyPath(pathOrOptions.path);
            path = pathOrOptions.path.trim();
            useOptions = pathOrOptions

            // But if the first argument isn't a (truthy) object, it could also be a valid path string. Verify and maybe use that,
            // and if so, look for and use a second object as options:
        } else {
            const isArray = Array.isArray(options);
            if (!options || (typeof options === 'object' && !isArray)) {
                useOptions = options || {};
                throwErrors = !!useOptions.throwErrors;

            } else {
                throw Error(`Second argument (options) is if unexpected type '${isArray ? "array" : typeof options}'. Expected: object.`);
            }

            verifyPath(pathOrOptions);
            path = pathOrOptions.trim();
        }

        const {
            cacheControl,
            contentType,
            etag,
        } = useOptions;

        const cacheControlFunc = getCacheControlFunc(cacheControl);
        const contentTypeFunc = getContentTypeFunc(contentType);

        verifyEtagOption(etag);

        return {
            path,
            cacheControlFunc,
            contentTypeFunc,
            throwErrors,
            etagOverride: etag
        };

    } catch (e) {
        return {
            throwErrors,
            errorMessage: e.message
        };
    }
}
