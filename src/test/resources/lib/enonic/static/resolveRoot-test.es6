const DEFAULT_CACHE_CONTROL = require('/lib/enonic/static/options').DEFAULT_CACHE_CONTROL;

const ioMock = require('/lib/enonic/static/ioMock');

const t = require('/lib/xp/testing');

const mockedRunmodeFuncs = {};
const mockRunmode = () => {
    t.mock('/lib/enonic/static/runMode.js', mockedRunmodeFuncs);
}
mockRunmode();

const mockedIoFuncs = {};
const mockIo = () => {
    t.mock('/lib/enonic/static/io.js', mockedIoFuncs);
}
mockIo();

const mockedEtagreaderFuncs = {};
const mockEtagreader = () => {
    t.mock('/lib/enonic/static/etagReader.js', mockedEtagreaderFuncs);
}
mockEtagreader();

const mockedOptionsparserFuncs = {};
const mockOptionsparser = () => {
    t.mock('/lib/enonic/static/options.js', mockedOptionsparserFuncs);
}
mockOptionsparser();

const lib = require('./index');

//////////////////////////////////////////////////////////////////  HELPERS

                                                                                                                        const prettify = (obj, label, suppressCode= false, indent = 0) => {
                                                                                                                            let str = " ".repeat(indent) + (
                                                                                                                                label !== undefined
                                                                                                                                    ? label + ": "
                                                                                                                                    : ""
                                                                                                                            );

                                                                                                                            if (typeof obj === 'function') {
                                                                                                                                if (!suppressCode) {
                                                                                                                                    return `${str}···· (function)\n${" ".repeat(indent + 4)}` +
                                                                                                                                        obj.toString()
                                                                                                                                            .replace(
                                                                                                                                                /\r?\n\r?/g,
                                                                                                                                                `\n${" ".repeat(indent + 4)}`
                                                                                                                                            ) +
                                                                                                                                        "\n" + " ".repeat(indent) + "····"
                                                                                                                                        ;
                                                                                                                                } else {
                                                                                                                                    return `${str}···· (function)`;
                                                                                                                                }

                                                                                                                            } else if (Array.isArray(obj)) {
                                                                                                                                return obj.length === 0
                                                                                                                                    ? `${str}[]`
                                                                                                                                    : (
                                                                                                                                        `${str}[\n` +
                                                                                                                                        obj.map(
                                                                                                                                            (item, i) =>
                                                                                                                                                prettify(item, i, suppressCode, indent + 4)
                                                                                                                                        )
                                                                                                                                            .join(",\n") +
                                                                                                                                        `\n${" ".repeat(indent)}]`
                                                                                                                                    );

                                                                                                                            } else if (obj && typeof obj === 'object') {
                                                                                                                                try {
                                                                                                                                    if (Object.keys(obj).length === 0) {
                                                                                                                                        return `${str}{}`;
                                                                                                                                    } else {
                                                                                                                                        return `${str}{\n` +
                                                                                                                                            Object.keys(obj).map(
                                                                                                                                                key => prettify(obj[key], key, suppressCode, indent + 4)
                                                                                                                                            ).join(",\n") +
                                                                                                                                            `\n${" ".repeat(indent)}}`
                                                                                                                                    }
                                                                                                                                } catch (e) {
                                                                                                                                    log.info(e);
                                                                                                                                    return `${str}···· (${typeof obj})\n${" ".repeat(indent + 4)}` +
                                                                                                                                        obj.toString()
                                                                                                                                            .replace(
                                                                                                                                                /\r?\n\r?/g,
                                                                                                                                                `\n${" ".repeat(indent + 4)}`
                                                                                                                                            ) +
                                                                                                                                        "\n" + " ".repeat(indent) + `····`;
                                                                                                                                }
                                                                                                                            } else if (obj === undefined || obj === null) {
                                                                                                                                return `${str}${obj}`;
                                                                                                                            } else if (JSON.stringify(obj) !== undefined) {
                                                                                                                                return `${str}` + JSON.stringify(obj, null, 2).replace(
                                                                                                                                    /\r?\n\r?/g,
                                                                                                                                    `\n${" ".repeat(indent + 2)}`
                                                                                                                                );
                                                                                                                            } else {
                                                                                                                                return `${str}···· (${typeof obj})\n${" ".repeat(indent + 4)}` +
                                                                                                                                    obj.toString()
                                                                                                                                        .replace(
                                                                                                                                            /\r?\n\r?/g,
                                                                                                                                            `\n${" ".repeat(indent + 4)}`
                                                                                                                                        ) +
                                                                                                                                    "\n" + " ".repeat(indent) + `····`;
                                                                                                                            }
                                                                                                                        };

/* Mocks runMode.js, io.js, etagReader.js and options.js.
  Optional params: {
    isDev: boolean,
    io: {
        getResource: function [(path) => resource], or instead, the following 3 can be used as args to mockIo.getResource:
        path: string,
        exists: boolean,
        content: string,

        readText: function [(stream) => string], or instead, the following 1 can be used as arg to mockIo.readText:
        text: string

        getMimeType: function[(name) => string], or instead, the following 1 can be used as arg to mockIo.getMimeType:
        mimeType: string
    },
    etagReader: {
        read: function[(path, etagOverride) => string], or instead, the following 1:
        etag: string
    },
    options: {
        parsePathAndOptions: function[(pathOrOptions, options) => {path,cacheControlFunc,contentTypeFunc,etagOverride,throwErrors,errorMessage}],
        parseRootAndOptions: function[(rootOrOptions, options) => {root,cacheControlFunc,contentTypeFunc,etagOverride,getCleanPath,throwErrors,errorMessage}]
            Instead of those two, the following can be used override OUTPUT from mocked passthrough versions of those two:
        root: string,
        contentTypeFunc: function [(filePathAndName, resource, mimeType) => string]
        cacheControlFunc: function [(filePathAndName, resource) => string]
        cacheControl: string or boolean
        contentType: string or boolean
        etag: string
        throwErrors: boolean
        getCleanPath: function
    }
 */
const doMocks = (params={}, verbose= false) => {

    mockedRunmodeFuncs.isDev = (typeof params.isDev === 'boolean' )
        ? () => {
                                                                                                                        if (verbose) log.info(prettify(params.isDev, "Mocked isDev"));
            return params.isDev
        }
        : () => false;
    mockRunmode();



    const io = params.io || {};
    mockedIoFuncs.getResource = io.getResource || (
        (path) => {
            const data = {
                path: (io.path !== undefined) ? io.path : path,
                exists: (io.exists !== undefined) ? io.exists : true,
            };
            data.content = (io.content !== undefined) ? io.content : `Mocked content of '${data.path}'`;

            const res = ioMock.getResource(data.path, data.exists, data.content);

                                                                                                                        if (verbose) log.info(prettify(data, "Mocked io.getResource(" + JSON.stringify(path) + ")"));
            return res;
        }
    );
    mockedIoFuncs.readText = io.readText || (
        (stream) => {
            const text = io.text || ioMock.readText(stream);
                                                                                                                        if (verbose) log.info(prettify(text,"Mocked io.readText(stream)"));
            return text;
        }
    );
    mockedIoFuncs.getMimeType = io.getMimeType || (
        (name) => {
            const mimeType = io.mimeType || ioMock.getMimeType(name);
                                                                                                                        if (verbose) log.info(prettify(mimeType, "Mocked io.getMimeType(" + JSON.stringify(name) + ")"));
            return mimeType;
        }
    );
    mockIo();



    const etagReader = params.etagReader || {};
    mockedEtagreaderFuncs.read = etagReader.read || (
        (path, etagOverride) => {
            const etag = etagReader.etag || "MockedETagPlaceholder";
                                                                                                                        if (verbose) log.info(prettify(etag, "Mocked etagReader.read(" + JSON.stringify({path, etagOverride}) + ")"));
            return etag;
        }
    );
    mockEtagreader();



    const optionParams = params.options || {};
    const defaultOptions = {
        contentTypeFunc: (optionParams.contentType !== undefined)
            ? () => optionParams.contentType
            : ioMock.getMimeType,
        cacheControlFunc: (optionParams.cacheControl !== undefined)
            ? () => optionParams.cacheControl
            : () => DEFAULT_CACHE_CONTROL
    };
    mockedOptionsparserFuncs.parsePathAndOptions = optionParams.parsePathAndOptions || (
        (pathOrOptions, options) => {
            const parsed = (typeof pathOrOptions === 'string')
                ? { path: pathOrOptions, ...defaultOptions, ...options, ...optionParams }
                : { ...defaultOptions, ...pathOrOptions, ...optionParams };
                                                                                                                        if (verbose) log.info(prettify(parsed, "Mocked parseRootAndOptions(" + JSON.stringify({pathOrOptions, options}) + ")"));
            return parsed;
        }
    );
    mockedOptionsparserFuncs.parseRootAndOptions = optionParams.parseRootAndOptions || (
        (rootOrOptions, options) => {
            const parsed = (typeof rootOrOptions === 'string')
                ? { root: rootOrOptions, ...defaultOptions, ...options, ...optionParams }
                : { ...defaultOptions, ...rootOrOptions, ...optionParams };
                                                                                                                        if (verbose) log.info(prettify(parsed, "Mocked parseRootAndOptions(" + JSON.stringify({rootOrOptions, options}) + ")"));
            return parsed;
        }
    );
    mockOptionsparser();
}





const verbose = false;

//////////////////////////////////////////////////////////////////  TEST .__resolvePath__



// FIXME: Namespace collisions (?) create some trouble: mocked lib behaviours "leak" from one test to the next. Until solved, these must run in the same test function.
exports.testResolveRoot = () => {
    // const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestStatic_innerbehavior_rootAssertion_isCalled:\n");
    doMocks({}, verbose);
    const lib = require('./index');


    // ----
                                                                                                                        if (verbose) log.info("Testing relative root resolution: absolute path with leading slash, no trailing slash");

    t.assertEquals("/all/those/moments/will/be/lost/in/time", lib.__resolveRoot__("all/those/moments//////will/be/lost/in/time"));
    t.assertEquals("/will/be/lost/in/time", lib.__resolveRoot__("all/../those/../moments/../will/be/lost/in/time/"));
    t.assertEquals("/will/be/lost/in/time", lib.__resolveRoot__("will/be/lost/in/time/like/../tears/../in/../rain/.."));
    t.assertEquals("/will/be/lost/in/time", lib.__resolveRoot__("all/those/moments/../../../will/be/lost/in/time"));
    t.assertEquals("/will/be/lost/in/time", lib.__resolveRoot__("will/be/lost/in/time/like/../tears/in/rain/../../.."));
    t.assertEquals("/will/be/lost/in/time", lib.__resolveRoot__("will/be/lost/in/time/like/../tears/in/rain/../../../"));
    t.assertEquals("/will/be/in/time", lib.__resolveRoot__("will/be/lost/../in/time/"));


    // ----
                                                                                                                        if (verbose) log.info("Testing root prevention");

    let failed = true;

    try {
        lib.__resolveRoot__("/");
        failed = false;
    } catch (e) {
                                                                                                                        if (verbose) log.error(e);
    }
    t.assertTrue(failed, "Should have failed: /");

    try {
        lib.__resolveRoot__("/..");
        failed = false;
    } catch (e) {
                                                                                                                        if (verbose) log.error(e);
    }
    t.assertTrue(failed, "Should have failed: /..");

    try {
        lib.__resolveRoot__("../");
        failed = false;
    } catch (e) {
                                                                                                                        if (verbose) log.error(e);
    }
    t.assertTrue(failed, "Should have failed: ../");

    try {
        lib.__resolveRoot__("////////");
        failed = false;
    } catch (e) {
                                                                                                                        if (verbose) log.error(e);
    }
    t.assertTrue(failed, "Should have failed: ////////");

    try {
        lib.__resolveRoot__("begone/..");
        failed = false;
    } catch (e) {
                                                                                                                        if (verbose) log.error(e);
    }
    t.assertTrue(failed, "Should have failed: begone/..");

    try {
        lib.__resolveRoot__("../all/../those/../moments/../will/be/lost/in/time");
        failed = false;
    } catch (e) {
                                                                                                                        if (verbose) log.error(e);
    }
    t.assertTrue(failed, "Should have resolved to '/../will/be/lost/in/time' and failed: '../all/../those/../moments/../will/be/lost/in/time'");


    try {
        lib.__resolveRoot__("../will/be/lost/in/time/like/../tears/../in/../rain/..");
        failed = false;
    } catch (e) {
                                                                                                                        if (verbose) log.error(e);
    }
    t.assertTrue(failed, "Should have resolved to '/../will/be/lost/in/time' and failed: '../will/be/lost/in/time/like/../tears/../in/../rain/..'");




    // ----
                                                                                                                        if (verbose) log.info("Testing inner behavior: getPathError is called with the input path (trimmed of slashes), no error if nothing returned");

    let getPathErrorWasCalled = false;
    lib.__getPathError__ = (path) => {
        t.assertEquals('please/resolve/this', path);               // Called WITHOUT leading/trailing slashes - removed inside resolveRoot.
        getPathErrorWasCalled = true;
    }

    lib.buildGetter('/please/resolve/this/');

    t.assertTrue(getPathErrorWasCalled, "getPathError should be called with path as part of resolveRoot");


    // ----
                                                                                                                        if (verbose) log.info("Testing inner behavior: getPathError is called with the input path, .buildGetter fails with with returned string if getPathError returns a string");


    lib.__getPathError__ = (path) => {
        return "This error was thrown on purpose"
    }

    try {
        lib.buildGetter('/please/fail/');
        failed = false;
    } catch (e) {
                                                                                                                        if (verbose) log.error(e);
        t.assertTrue(e.message.indexOf("This error was thrown on purpose") > -1, "Expected returned string thrown as error message");
    }

    t.assertTrue(failed, "Should fail when getPathError returns an error message");


    // ----
                                                                                                                        if (verbose) log.info("Testing inner behavior: resolveRoot is called with the input root, no error");

    let resolveRootWasCalled = false;
    lib.__resolveRoot__ = (root) => {
        t.assertEquals('/please/resolve/this/', root);              // Called WITH leading/trailing slashes - they are removed inside resolveRoot.
        resolveRootWasCalled = true;
    }

    lib.buildGetter('/please/resolve/this/');

    t.assertTrue(resolveRootWasCalled, "resolveRootWasCalled");

    // ----
                                                                                                                        if (verbose) log.info("Testing inner behavior: error during resolveRoot causes .buildGetter to fail");

    lib.__resolveRoot__ = (root) => {
        throw Error("This was thrown on purpose");
    }

    try {
        lib.buildGetter('/please/fail/');
        failed = false;
    } catch (e) {
                                                                                                                        if (verbose) log.error(e);
        t.assertTrue(e.message.indexOf("on purpose") > -1, "Expected on-purpose error");
    }

    t.assertTrue(failed, "Should fail when resolveRoot throws an error");



    log.info("OK");
}
