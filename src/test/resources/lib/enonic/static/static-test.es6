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
        getResource: function [(path) => resource]
            ...or instead, the following 3 can be used as args to mockIo.getResource:
        path: string,
        exists: boolean,
        content: string,

        readText: function [(stream) => string]
            ...or instead, the following 1 can be used as arg to mockIo.readText:
        text: string

        getMimeType: function[(name) => string]
            ...or instead, the following 1 can be used as arg to mockIo.getMimeType:
        mimeType: string
    },
    etagReader: {
        read: function[(path, etagOverride) => string]
            ...or instead, the following 1:
        etag: string
    },
    options: {
        parsePathAndOptions: function[(pathOrOptions, options) => {path,cacheControlFunc,contentTypeFunc,etagOverride,throwErrors,errorMessage}],
        parseRootAndOptions: function[(rootOrOptions, options) => {root,cacheControlFunc,contentTypeFunc,etagOverride,getCleanPath,throwErrors,errorMessage}]
            ...Instead of those two, the following can be used override OUTPUT from mocked passthrough versions of those two:
        root: string
        contentTypeFunc: function [(filePathAndName, resource) => string]
        cacheControlFunc: function [(filePathAndName, resource, mimeType) => string]
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













//////////////////////////////////////////////////////////////////  TEST .static innerbehaviour

exports.testStatic_innerbehavior_1arg_parseRootAndOptions_isCalled = () => {
    // const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestStatic_innerbehavior_1arg_parseRootAndOptions_isCalled:\n");
    let parseRootAndOptionsWasCalled = false;
    doMocks({
            options: {
                parseRootAndOptions: (rootOrOptions, options) => {
                                                                                                                        if (verbose) log.info(prettify(rootOrOptions, "parseRootAndOptions call - rootOrOptions"));
                                                                                                                        if (verbose) log.info(prettify(options, "parseRootAndOptions call - options"));

                    // Verify that the arguments of .static are passed into parseRootAndOptions the expected way:
                    t.assertEquals(undefined, options, "parseRootAndOptions: options");
                    t.assertEquals('object', typeof rootOrOptions , "parseRootAndOptions: rootOrOptions");
                    t.assertEquals('my/root', rootOrOptions.root , "parseRootAndOptions: rootOrOptions.root");
                    t.assertEquals(undefined, rootOrOptions.path , "parseRootAndOptions: rootOrOptions.path");
                    t.assertEquals('throwErrors/should/be/boolean/but/ok', rootOrOptions.throwErrors , "parseRootAndOptions: rootOrOptions.throwErrors");
                    t.assertEquals('cacheControl/string/or/function/but/ok', rootOrOptions.cacheControl , "parseRootAndOptions: rootOrOptions.cacheControl");
                    t.assertEquals('contentType/string/object/or/function/but/ok', rootOrOptions.contentType , "parseRootAndOptions: rootOrOptions.contentType");
                    t.assertEquals('etag/should/be/boolean/but/ok', rootOrOptions.etag , "parseRootAndOptions: rootOrOptions.etag");
                    t.assertEquals('getCleanPath/should/be/function/but/ok', rootOrOptions.getCleanPath , "parseRootAndOptions: rootOrOptions.getCleanPath");
                                                                                                                        if (verbose) log.info("Correct call.");
                    // Verify to the caller that this mock function was actually called and the above was verified:
                    parseRootAndOptionsWasCalled = true;

                    // Not testing returns, just returning something to prevent false-negative-looking error log.
                    return {
                        root: rootOrOptions.root,
                        contentTypeFunc: () => rootOrOptions.contentType,
                        cacheControlFunc: () => rootOrOptions.cacheControl
                    };
                },
            }
        },
        verbose);

    const getStatic = lib.static({
        root: 'my/root',
        throwErrors: 'throwErrors/should/be/boolean/but/ok',
        cacheControl: 'cacheControl/string/or/function/but/ok',
        contentType: 'contentType/string/object/or/function/but/ok',
        etag: 'etag/should/be/boolean/but/ok',
        getCleanPath: 'getCleanPath/should/be/function/but/ok'
    });
                                                                                                                        if (verbose) log.info(prettify(getStatic, "getStatic"));
    t.assertTrue(parseRootAndOptionsWasCalled, "parseRootAndOptionsWasCalled");
};

exports.testStatic_innerbehavior_2arg_parseRootAndOptions_isCalled = () => {
    // const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestStatic_innerbehavior_2arg_parseRootAndOptions_isCalled:\n");
    let parseRootAndOptionsWasCalled = false;
    doMocks({
            options: {
                parseRootAndOptions: (rootOrOptions, options) => {
                                                                                                                        if (verbose) log.info(prettify(rootOrOptions, "parseRootAndOptions call - rootOrOptions"));
                                                                                                                        if (verbose) log.info(prettify(options, "parseRootAndOptions call - options"));

                    // Verify that the arguments of .static are passed into parseRootAndOptions the expected way:
                    t.assertEquals('my/root', rootOrOptions , "parseRootAndOptions: rootOrOptions");
                    t.assertEquals('object', typeof options, "parseRootAndOptions: options");
                    t.assertEquals(undefined, options.root , "parseRootAndOptions: options.root");
                    t.assertEquals(undefined, options.path , "parseRootAndOptions: options.path");
                    t.assertEquals('throwErrors/should/be/boolean/but/ok', options.throwErrors , "parseRootAndOptions: options.throwErrors");
                    t.assertEquals('cacheControl/string/or/function/but/ok', options.cacheControl , "parseRootAndOptions: options.cacheControl");
                    t.assertEquals('contentType/string/object/or/function/but/ok', options.contentType , "parseRootAndOptions: options.contentType");
                    t.assertEquals('etag/should/be/boolean/but/ok', options.etag , "parseRootAndOptions: options.etag");
                    t.assertEquals('getCleanPath/should/be/function/but/ok', options.getCleanPath , "parseRootAndOptions: options.getCleanPath");
                                                                                                                        if (verbose) log.info("Correct call.");
                    // Verify to the caller that this mock function was actually called and the above was verified:
                    parseRootAndOptionsWasCalled = true;

                    // Not testing returns, just returning something to prevent false-negative-looking error log.
                    return {
                        root: rootOrOptions,
                        contentTypeFunc: () => options.contentType,
                        cacheControlFunc: () => options.cacheControl
                    };
                },
            }
        },
        verbose);

    const getStatic = lib.static(
        'my/root',
        {
            throwErrors: 'throwErrors/should/be/boolean/but/ok',
            cacheControl: 'cacheControl/string/or/function/but/ok',
            contentType: 'contentType/string/object/or/function/but/ok',
            etag: 'etag/should/be/boolean/but/ok',
            getCleanPath: 'getCleanPath/should/be/function/but/ok'
        }
    );
                                                                                                                        if (verbose) log.info(prettify(getStatic, "getStatic"));
    t.assertTrue(parseRootAndOptionsWasCalled, "parseRootAndOptionsWasCalled");
};

exports.testStatic_innerbehavior_parseRootAndOptions_errorMessage_shouldThrowError = () => {
    // const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestStatic_innerbehavior_parseRootAndOptions_errorMessage_shouldThrowError:\n");

    doMocks({
            options: {
                errorMessage: "Throw this error on purpose, should be logged but not output"
            },
        },
        verbose);

    let failed = true;
    try {
        const getStatic = lib.static("my/root");
        failed = false;
                                                                                                                        if (verbose) log.info(prettify(getStatic, "getStatic"));
    } catch (e) {
                                                                                                                        if (verbose) log.error(e);
        t.assertTrue(e.message.indexOf("on purpose") > -1, "Expected purposefully thrown error");
    }

    t.assertTrue(failed, "Should have failed on error message from parseRootAndOptions");

    log.info("OK.");
};



exports.testStatic_innerbehavior_parseRootAndOptions_outputs_areUsed = () => {
    // const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestStatic_innerbehavior_parseRootAndOptions_outputs_areUsed:\n");
    let getResourceWasCalled = false;
    let parseRootAndOptionsWasCalled = false;
    let etagReadWasCalled = false;
    let getCleanPathWasCalled = false;
    let cacheControlFuncWasCalled = false;
    let contentTypeFuncWasCalled = false;

    doMocks({
            options: {
                parseRootAndOptions: (rootOrOptions, options) => {
                    parseRootAndOptionsWasCalled = true;
                    return {
                        root: 'options/root/out',
                        etagOverride: 'options/etagOverride/out',
                        getCleanPath: (request) => {
                            t.assertEquals("i/am/a/rawPath", request.rawPath, "options.getCleanPath.request.rawPath");
                            getCleanPathWasCalled = true;

                            // This is the cleaned path extracted from the request. The root will be prefixed to it for a final absolute resource path - the cleanPath: --> /options/root/out/cleaned/rawPath
                            return "/cleaned/rawPath";
                        },
                        contentTypeFunc: (cleanPath, resource) => {
                            t.assertEquals('/options/root/out/cleaned/rawPath', cleanPath, "options.contentType.cleanPath");
                            t.assertTrue(resource.exists(), "options.contentType.resource.exists");
                            contentTypeFuncWasCalled = true;
                            return 'options/contentType/out';
                        },
                        cacheControlFunc: (cleanPath, resource, contentType) => {
                            t.assertEquals('/options/root/out/cleaned/rawPath', cleanPath, "options.cacheControlFunc.cleanPath");
                            t.assertTrue(resource.exists(), "options.cacheControlFunc.resource.exists");
                            t.assertEquals('options/contentType/out', contentType, "options.cacheControlFunc.contentType");
                            cacheControlFuncWasCalled = true;
                            return 'options/cacheControl/out';
                        },
                    }
                }
            },
            io: {
                getResource: (cleanPath) => {
                    t.assertEquals('/options/root/out/cleaned/rawPath', cleanPath, "io.getResource.cleanPath");
                    getResourceWasCalled = true;
                    return ioMock.getResource(cleanPath, true, `Content for ${cleanPath}`);
                }
            },
            etagReader: {
                read: (cleanPath, etagOverride) => {
                    t.assertEquals('/options/root/out/cleaned/rawPath', cleanPath, "etagReader.read.cleanPath");
                    t.assertEquals('options/etagOverride/out', etagOverride, "etagReader.read.etagOverride");
                    etagReadWasCalled = true;
                    return "reader/etag/out";
                }
            }
        },
        verbose);

    const getStatic = lib.static('arg/root/in', {
        etag: 'arg/etag/in',
        cacheControl: 'arg/cacheControl/in',
        contentType: 'arg/contentType/in'
    });
                                                                                                                        if (verbose) log.info(prettify(getStatic, "getStatic"));
    t.assertTrue(parseRootAndOptionsWasCalled, "parseRootAndOptionsWasCalled");

    t.assertFalse(getResourceWasCalled, "getResourceWasCalled");
    t.assertFalse(etagReadWasCalled, "etagReadWasCalled");
    t.assertFalse(getCleanPathWasCalled, "getCleanPathWasCalled");
    t.assertFalse(cacheControlFuncWasCalled, "cacheControlFuncWasCalled");
    t.assertFalse(contentTypeFuncWasCalled, "contentTypeFuncWasCalled");

    const request = {
        rawPath: "i/am/a/rawPath"
    };
    const result = getStatic(request);

    t.assertTrue(getResourceWasCalled, "getResourceWasCalled");
    t.assertTrue(etagReadWasCalled, "etagReadWasCalled");
    t.assertTrue(getCleanPathWasCalled, "getCleanPathWasCalled");
    t.assertTrue(cacheControlFuncWasCalled, "cacheControlFuncWasCalled");
    t.assertTrue(contentTypeFuncWasCalled, "contentTypeFuncWasCalled");

    t.assertEquals('options/cacheControl/out', result.headers['Cache-Control'], 'cacheControl');
    t.assertEquals('reader/etag/out', result.headers.ETag, 'cacheControl');
    t.assertEquals('options/contentType/out', result.contentType, 'contentType');
};





//////////////////////////////////////////////////////////////////  TEST getStatic


// Path string argument

exports.testGetStatic_root_string_FullDefaultResponse = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_root_string_FullDefaultResponse:\n");
    doMocks({}, verbose);

    const getStatic = lib.static('/i/am/root');

    const result = getStatic({
        rawPath: '/assets/asset-test-target.txt',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info(prettify(result, "result"));
    t.assertEquals(200, result.status, "result.status");
    t.assertEquals("Mocked content of '/i/am/root/asset-test-target.txt'", ioMock.readText(result.body), "result.body");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain'");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain'");

    t.assertTrue(!!result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals('object', typeof result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals( "MockedETagPlaceholder", result.headers.ETag, "result.headers should be an object with ETag and Cache-Control");
    t.assertTrue(result.headers.ETag.length > 0, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals(DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"], "result.headers should be an object with ETag and Cache-Control");
};

exports.testGetStatic_root_option_FullDefaultResponse = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_root_option_FullDefaultResponse:\n");
    doMocks({}, verbose);

    const getStatic = lib.static({root: '/i/am/root'});

    const result = getStatic({
        rawPath: '/assets/asset-test-target.txt',
        contextPath: '/assets'
    });                                                                                                                 if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(200, result.status, "result.status");
    t.assertEquals("Mocked content of '/i/am/root/asset-test-target.txt'", ioMock.readText(result.body), "result.body");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain'");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain'");

    t.assertTrue(!!result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals('object', typeof result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals( "MockedETagPlaceholder", result.headers.ETag, "result.headers should be an object with ETag and Cache-Control");
    t.assertTrue(result.headers.ETag.length > 0, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals(DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"], "result.headers should be an object with ETag and Cache-Control");

};

exports.testGetStatic_DEV_root_string_FullDefaultResponse = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_DEV_root_string_FullDefaultResponse:\n");
    doMocks({isDev: true}, verbose);

    const getStatic = lib.static('/i/am/root');

    const result = getStatic({
        rawPath: '/assets/asset-test-target.txt',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(200, result.status, "result.status");
    t.assertEquals("Mocked content of '/i/am/root/asset-test-target.txt'", ioMock.readText(result.body), "result.body");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain'");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain'");

    t.assertTrue(!!result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals('object', typeof result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals( "MockedETagPlaceholder", result.headers.ETag, "result.headers should be an object with ETag and Cache-Control");
    t.assertTrue(result.headers.ETag.length > 0, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals(DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"], "result.headers should be an object with ETag and Cache-Control");
};

exports.testGetStatic_DEV_root_option_FullDefaultResponse = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_DEV_root_option_FullDefaultResponse:\n");
    doMocks({isDev: true}, verbose);

    const getStatic = lib.static({root: '/i/am/root'});

    const result = getStatic({
        rawPath: '/assets/asset-test-target.txt',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(200, result.status, "result.status");
    t.assertEquals("Mocked content of '/i/am/root/asset-test-target.txt'", ioMock.readText(result.body), "result.body");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain'");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain'");

    t.assertTrue(!!result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals('object', typeof result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals( "MockedETagPlaceholder", result.headers.ETag, "result.headers should be an object with ETag and Cache-Control");
    t.assertTrue(result.headers.ETag.length > 0, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals(DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"], "result.headers should be an object with ETag and Cache-Control");

};

// Tests that the contentTypeFunc returned from parseRootAndOptions is used as expected, and on repeated getStatic calls.
// Fallback to built-in type detection when the function returns null is not tested here, but as part of parseRootAndOptions.
exports.testGetStatic_contentType = () => {
                                                                                                                        if (verbose) log.info("\n\n\ttestGetStatic_contentType:\n");
    doMocks({
            options: {
                contentTypeFunc: (filePathAndName, resource) => {
                                                                                                                        if (verbose) log.info(prettify(filePathAndName, "contentTypeFunc.filePathAndName"));
                                                                                                                        if (verbose) log.info(prettify(resource, "contentTypeFunc.resource"));
                    if (filePathAndName.endsWith(".html")) {
                        return "teKSt/html";
                    }
                    if (filePathAndName.endsWith(".txt")) {
                        return "teczt/playn";
                    }
                    if (!!resource) {
                        return "has/resource";
                    }
                }
            }
        },
        verbose);

    const getStatic = lib.static({root: '/i/am/root'});

    // .txt

    const result1 = getStatic({
        rawPath: '/assets/asset-test-target.txt',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info(prettify(result1, "result1"));

    t.assertEquals(200, result1.status, "result1.status");

    t.assertEquals('string', typeof result1.contentType, "Expected result1 string contentType containing 'teKSt/html'");
    t.assertTrue(result1.contentType.indexOf("teczt/playn") !== -1, "Expected result1 string contentType containing 'teczt/playn'");

    // .html

    const result2 = getStatic({
        rawPath: '/assets/asset-test-target.html',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info(prettify(result2, "result2"));

    t.assertEquals(200, result2.status, "result2.status");

    t.assertEquals('string', typeof result2.contentType, "Expected result2 string contentType containing 'teKSt/html'");
    t.assertTrue(result2.contentType.indexOf("teKSt/html") !== -1, "Expected result2 string contentType containing 'teKSt/html'");

    // .json: verifies that the resource object is available in the contentTypeFunc function

    const result3 = getStatic({
        rawPath: '/assets/asset-test-target.json',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info(prettify(result3, "result3"));

    t.assertEquals(200, result3.status, "result3.status");

    t.assertEquals('string', typeof result3.contentType, "Expected result3 string contentType containing 'has/resource'");
    t.assertTrue(result3.contentType.indexOf("has/resource") !== -1, "Expected result3 string contentType containing 'has/resource'");
}


// Tests that the cacheControlFunc returned from parseRootAndOptions is used as expected, and on repeated getStatic calls.
// Fallback when the function returns null is not tested here, but as part of parseRootAndOptions.
exports.testGetStatic_cacheControl = () => {
                                                                                                                        if (verbose) log.info("\n\n\ttestGetStatic_cacheControl:\n");
    doMocks({
            options: {
                cacheControlFunc: (filePathAndName, resource, mimeType) => {
                                                                                                                        if (verbose) log.info(prettify(filePathAndName, "cacheControlFunc.filePathAndName"));
                                                                                                                        if (verbose) log.info(prettify(resource, "cacheControlFunc.resource"));
                                                                                                                        if (verbose) log.info(prettify(mimeType, "cacheControlFunc.mimeType"));
                    if (filePathAndName.endsWith(".html")) {
                        return "htmlthmlhtml";
                    }
                    if (filePathAndName.endsWith(".txt")) {
                        return "txttxttxt";
                    }
                    return (!!resource ? "has-resource" : "no-resource") + "-" + mimeType;
                }
            }
        },
        verbose);

    const getStatic = lib.static({root: '/i/am/root'});

    // .txt

    const result1 = getStatic({
        rawPath: '/assets/asset-test-target.txt',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info(prettify(result1, "result1"));

    t.assertEquals(200, result1.status, "result1.status");

    t.assertEquals('string', typeof result1.headers['Cache-Control'], "Expected result1 string cacheControl containing 'txttxttxt'");
    t.assertTrue(result1.headers['Cache-Control'].indexOf("txttxttxt") !== -1, "Expected result1 string cacheControl containing 'txttxttxt'");

    // .html

    const result2 = getStatic({
        rawPath: '/assets/asset-test-target.html',
        contextPath: '/assets'
    });
    if (verbose) log.info(prettify(result2, "result2"));

    t.assertEquals(200, result2.status, "result2.status");

    t.assertEquals('string', typeof result2.headers['Cache-Control'], "Expected result2 string cacheControl containing 'htmlthmlhtml'");
    t.assertTrue(result2.headers['Cache-Control'].indexOf("htmlthmlhtml") !== -1, "Expected result2 string cacheControl containing 'htmlthmlhtml'");


    // .json: verifies that both the resource object and the detected mime type is available in the cacheControlFunc function

    const result3 = getStatic({
        rawPath: '/assets/asset-test-target.json',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info(prettify(result3, "result3"));

    t.assertEquals(200, result3.status, "result3.status");

    t.assertEquals('string', typeof result3.headers['Cache-Control'], "Expected result3 string cacheControl containing 'has-resource-application/json'");
    t.assertTrue(result3.headers['Cache-Control'].indexOf("has-resource-application/json") !== -1, "Expected result3 string cacheControl containing 'has-resource-application/json'");
}


// Getcleanpath function can extract clean path from request in a custom manner, and be used repeatedly with getStatic:
exports.testGetStatic_getCleanPath = () => {
                                                                                                                        if (verbose) log.info("\n\n\ttestGetStatic_getCleanPath:\n");
    doMocks({
            options: {
                getCleanPath: (request) => request.targetPath.substring("/myprefix/".length)
            }
        },
        verbose);

    const getStatic = lib.static({root: '/i/am/root'});

    // target1

    const result1 = getStatic({
        targetPath: '/myprefix/subfolder/asset-target1.txt',
    });
                                                                                                                        if (verbose) log.info(prettify(result1, "result1"));
                                                                                                                        if (verbose) log.info(prettify(ioMock.readText(result1.body), "result1.body content"));

    t.assertEquals(200, result1.status, "result1.status");
    t.assertTrue(ioMock.readText(result1.body).indexOf("/i/am/root/subfolder/asset-target1.txt") !== -1, "Expected result1 body containing content of '/i/am/root/subfolder/asset-target1.txt'");

    // target2

    const result2 = getStatic({
        targetPath: '/myprefix/asset-target2.txt',
    });
                                                                                                                        if (verbose) log.info(prettify(result2, "result2"));
                                                                                                                        if (verbose) log.info(prettify(ioMock.readText(result2.body), "result2.body content"));

    t.assertEquals(200, result2.status, "result2.status");
    t.assertTrue(ioMock.readText(result2.body).indexOf("/i/am/root/asset-target2.txt") !== -1, "Expected result2 body containing content of '/i/am/root/asset-target2.txt'");
};




// .static problem/error handling:

exports.testGetStatic_root_noExist_shouldOnly404 = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_root_noExist_shouldOnly404:\n");
    doMocks({
            io: {
                exists: false
            }
        },
        verbose);

    const getStatic = lib.static({root: '/i/am/root'});

    const result = getStatic({
        rawPath: '/assets/asset-test-target.txt',
        contextPath: '/assets'
    });

                                                                                                                        if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(404, result.status, "result.status");

    t.assertEquals(undefined, result.body, "result.body");
    t.assertEquals(undefined, result.contentType, "result.contentType");
    t.assertEquals(undefined, result.headers, "result.headers");
};

exports.testGetStatic_DEV_root_noExist_should404withInfo = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_DEV_root_noExist_should404withInfo:\n");
    doMocks({
            isDev: true,
            io: {
                exists: false
            }
        },
        verbose);

    const getStatic = lib.static({root: '/i/am/root'});

    const result = getStatic({
        rawPath: '/assets/asset-test-target.txt',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(404, result.status, "result.status");
    t.assertEquals('string', typeof result.body, "Expected string body containing path in dev");
    t.assertTrue(result.body.indexOf('/i/am/root/asset-test-target.txt') !== -1, "Expected string body containing path in dev");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain' in dev");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain' in dev");

    t.assertEquals(undefined, result.headers, "result.headers");
};


exports.testGetStatic_relativePath_empty_shouldOnly400 = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_relativePath_empty_shouldOnly400:\n");
    doMocks({}, verbose);

    const getStatic = lib.static({root: '/i/am/root'});

    const result = getStatic({
        rawPath: '/assets/',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(400, result.status, "result.status");

    t.assertEquals(undefined, result.body, "result.body");
    t.assertEquals(undefined, result.contentType, "result.contentType");
    t.assertEquals(undefined, result.headers, "result.headers");
}


exports.testGetStatic_DEV_relativePath_empty_should400WithInfo = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_DEV_relativePath_empty_should400WithInfo:\n");
    doMocks({ isDev: true }, verbose);

    const getStatic = lib.static({root: '/i/am/root'});

    const result = getStatic({
        rawPath: '/assets/',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(400, result.status, "result.status");

    t.assertEquals('string', typeof result.body, "Expected string body with error message in dev");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain' in dev");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain' in dev");

    t.assertEquals(undefined, result.headers, "result.headers");
}



exports.testGetStatic_noRawPath_should500 = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_noRawPath_should500:\n");
    doMocks({ isDev: true }, verbose);

    const getStatic = lib.static({root: '/i/am/root'});

    const result = getStatic({
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(500, result.status, "result.status");

    t.assertEquals('string', typeof result.body, "Expected string body with error message in dev");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain' in dev");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain' in dev");

    t.assertEquals(undefined, result.headers, "result.headers");
    log.info("OK.");
}

exports.testGetStatic_noContextPath_should500 = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_noContextPath_should500:\n");
    doMocks({ isDev: true }, verbose);

    const getStatic = lib.static({root: '/i/am/root'});

    const result = getStatic({
        rawPath: '/assets/asset-test-target.txt',
    });
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(500, result.status, "result.status");

    t.assertEquals('string', typeof result.body, "Expected string body with error message in dev");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain' in dev");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain' in dev");

    t.assertEquals(undefined, result.headers, "result.headers");
}


exports.testGetStatic_throwErrors_shouldThrowErrorInsteadOf500 = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_throwErrors_shouldThrowErrorInsteadOf500:\n");
    doMocks(
        {
            isDev: true,
            options: {
                throwErrors: true
            }
        },
        verbose
    );

    const getStatic = lib.static({root: '/i/am/root'});

    let failed = true;
    try {
        const result = getStatic({
            rawPath: '/assets/asset-test-target.txt',
        });
        failed = false;
                                                                                                                        if (verbose) log.info(prettify(result, "result"));
    } catch (e) {
                                                                                                                        if (verbose) log.error(e);
    }

    t.assertTrue(failed, "Should have thrown error instead of yielding a 500-type response");

    log.info("OK.");
}

exports.testGetStatic_failingContentTypeFunc_should500 = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_failingContentTypeFunc_should500:\n");
    doMocks(
        {
            options: {
                contentTypeFunc: () => { throw Error("Thrown on purpose"); }
            }
        },
        verbose
    );

    const getStatic = lib.static({root: '/i/am/root'});

    const result = getStatic({
        rawPath: '/assets/asset-test-target.txt',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(500, result.status, "result.status");
}


exports.testGetStatic_failingContentTypeFunc_throwErrors_shouldThrowErrorInsteadOf500 = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_failingContentTypeFunc_throwErrors_shouldThrowErrorInsteadOf500:\n");
    doMocks(
        {
            options: {
                contentTypeFunc: () => { throw Error("Thrown on purpose"); },
                throwErrors: true
            }
        },
        verbose
    );

    const getStatic = lib.static({root: '/i/am/root'});

    let failed = true;
    try {
        const result = getStatic({
            rawPath: '/assets/asset-test-target.txt',
            contextPath: '/assets'
        });
        failed = false;
                                                                                                                        if (verbose) log.info(prettify(result, "result"));
    } catch (e) {
                                                                                                                        if (verbose) log.error(e);
        t.assertTrue(e.message.indexOf("on purpose") > -1, "Thrown error should have been on purpose");
    }

    t.assertTrue(failed, "Should have thrown error instead of yielding a 500-type response");
    log.info("OK.");
}




exports.testGetStatic_failingCacheControlFunc_should500 = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_failingCacheControlFunc_should500:\n");
    doMocks(
        {
            options: {
                cacheControlFunc: () => { throw Error("Thrown on purpose"); }
            }
        },
        verbose
    );

    const getStatic = lib.static({root: '/i/am/root'});

    const result = getStatic({
        rawPath: '/assets/asset-test-target.txt',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(500, result.status, "result.status");
}


exports.testGetStatic_failingCacheControlFunc_throwErrors_shouldThrowErrorInsteadOf500 = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_failingCacheControlFunc_throwErrors_shouldThrowErrorInsteadOf500:\n");
    doMocks(
        {
            options: {
                cacheControlFunc: () => { throw Error("Thrown on purpose"); },
                throwErrors: true
            }
        },
        verbose
    );

    const getStatic = lib.static({root: '/i/am/root'});

    let failed = true;
    try {
        const result = getStatic({
            rawPath: '/assets/asset-test-target.txt',
            contextPath: '/assets'
        });
        failed = false;
                                                                                                                        if (verbose) log.info(prettify(result, "result"));
    } catch (e) {
                                                                                                                        if (verbose) log.error(e);
        t.assertTrue(e.message.indexOf("on purpose") > -1, "Thrown error should have been on purpose");
    }

    t.assertTrue(failed, "Should have thrown error instead of yielding a 500-type response");
    log.info("OK.");
}




exports.testGetStatic_failingGetCleanPath_should500 = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_failingGetCleanPath_should500:\n");
    doMocks(
        {
            options: {
                getCleanPath: () => { throw Error("Thrown on purpose"); }
            }
        },
        verbose
    );

    const getStatic = lib.static({root: '/i/am/root'});

    const result = getStatic({
        rawPath: '/assets/asset-test-target.txt',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(500, result.status, "result.status");
}


exports.testGetStatic_failingGetCleanPath_throwErrors_shouldThrowErrorInsteadOf500 = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_failingGetCleanPath_throwErrors_shouldThrowErrorInsteadOf500:\n");
    doMocks(
        {
            options: {
                getCleanPath: () => { throw Error("Thrown on purpose"); },
                throwErrors: true
            }
        },
        verbose
    );

    const getStatic = lib.static({root: '/i/am/root'});

    let failed = true;
    try {
        const result = getStatic({
            rawPath: '/assets/asset-test-target.txt',
            contextPath: '/assets'
        });
        failed = false;
                                                                                                                        if (verbose) log.info(prettify(result, "result"));
    } catch (e) {
                                                                                                                        if (verbose) log.error(e);
        t.assertTrue(e.message.indexOf("on purpose") > -1, "Thrown error should have been on purpose");
    }

    t.assertTrue(failed, "Should have thrown error instead of yielding a 500-type response");
    log.info("OK.");
}


exports.testGetStaticStatic_ifMatchingEtag_should304 = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStaticStatic_ifMatchingEtag_should304:\n");

    doMocks(
        {
            etagReader: {
                read: () => "test-etag-value"
            },
            options: {
                contentTypeFunc: () => { throw Error("Since ETag matches the 'If-None-Match' header, only a status 304 should be returned - expected no contentType func call since there should be no asset readout."); },
                cacheControlFunc: () => { throw Error("Since ETag matches the 'If-None-Match' header, only a status 304 should be returned - expected no cacheControl func call since there should be no asset readout."); }
            }
        },
        verbose
    );

    const getStatic = lib.static('/i/am/root/');

    const result = getStatic({
        rawPath: 'my/endpoint/asset-test-target.txt',
        contextPath: 'my/endpoint',
        headers: {
            'If-None-Match': 'test-etag-value'
        }
    });
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(304, result.status, "result.status");

    t.assertEquals(undefined, result.body, "result.body");
    t.assertEquals(undefined, result.contentType, "result.contentType");
    t.assertEquals(undefined, result.headers, "result.headers");
};


exports.testGetStaticStatic_ifNotMatchingEtag_shouldProceedWithAssetRead = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStaticStatic_ifNotMatchingEtag_shouldProceedWithAssetRead:\n");

    doMocks(
        {
            etagReader: {
                read: () => "CURRENT-etag-value"
            }
        },
        verbose
    );

    const getStatic = lib.static('/i/am/root/');

    const result = getStatic({
        rawPath: 'my/endpoint/asset-test-target.txt',
        contextPath: 'my/endpoint',
        headers: {
            'If-None-Match': 'OLD-etag-value'
        }
    });
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(200, result.status, "result.status");

    t.assertTrue(ioMock.readText(result.body).indexOf("/i/am/root/asset-test-target.txt") !== -1, "result.body");
    t.assertEquals("text/plain", result.contentType, "result.contentType");
    t.assertEquals("CURRENT-etag-value", result.headers.ETag, "result.headers.ETag");
};






/*




/////////////  Test getStatic errorHandling


exports.testGetStaticStatic_fail_rootArg_NotFoundFile_should404 = () => {
    const lib = require('./index');

    const getStatic = lib.static('static');
    const request = {
        rawPath: 'my/endpoint/doesNotExist.txt',
        contextPath: 'my/endpoint'
    };                                                  // --> /static/doesNotExist.txt

    const result = getStatic(request);

    t.assertTrue(!!result.body);
    t.assertEquals(404, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated

    log.info(`OK: ${result.status} - ${result.body}`);
}
exports.testGetStaticStatic_fail_optionsArg_NotFoundFile_should404 = () => {
    const lib = require('./index');

    const getStatic = lib.static({root: 'static'});              // Same as above, just root as named parameter
    const request = {
        rawPath: 'my/endpoint/doesNotExist.txt',
        contextPath: 'my/endpoint'
    };

    const result = getStatic(request);

    t.assertTrue(!!result.body);
    t.assertEquals(404, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
    t.assertTrue(!(result.headers || {})['Cache-Control']);
    t.assertTrue(!(result.headers || {}).ETag);

    log.info(`OK: ${result.status} - ${result.body}`);
}
exports.testGetStaticStatic_fail_NotFoundInRoot_should404 = () => {
    const lib = require('./index');

    const getStatic = lib.static('assets');
    const request = {
        rawPath: 'my/endpoint/static-test-text.txt',
        contextPath: 'my/endpoint'
    };                                                  // --> /assets/static-test-text.txt does not exist

    const result = getStatic(request);

    t.assertTrue(!!result.body);
    t.assertEquals(404, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated

    log.info(`OK: ${result.status} - ${result.body}`);
}

exports.testGetStaticStatic_fail_empty_should400 = () => {
    const lib = require('./index');

    const getStatic = lib.static('assets');
    const request = {
        rawPath: 'my/endpoint',                                // --> /assets/ yields empty relative path
        contextPath: 'my/endpoint'
    };

    const result = getStatic(request);

    t.assertTrue(!!result.body);
    t.assertEquals(400, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated

    log.info(`OK: ${result.status} - ${result.body}`)
}

exports.testGetStaticStatic_fail_slash_should400 = () => {
    const lib = require('./index');

    const getStatic = lib.static('assets');
    const request = {
        rawPath: 'my/endpoint/',                                // --> yields relative path '/'
        contextPath: 'my/endpoint'
    };

    const result = getStatic(request);

    t.assertTrue(!!result.body);
    t.assertEquals(400, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated

    log.info(`OK: ${result.status} - ${result.body}`)
}
exports.testGetStaticStatic_fail_slashes_should400 = () => {
    const lib = require('./index');

    const getStatic = lib.static('assets');
    const request = {
        rawPath: 'my/endpoint///',                                // --> yields relative path '///', counts as empty
        contextPath: 'my/endpoint'
    };

    const result = getStatic(request);

    t.assertTrue(!!result.body);
    t.assertEquals(400, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated

    log.info(`OK: ${result.status} - ${result.body}`)
}
exports.testGetStaticStatic_fail_illegalChars_should400 = () => {
    const lib = require('./index');

    const getStatic = lib.static('assets');
    const request = {
        rawPath: 'my/endpoint/the_characters>and<are_no_good',
        contextPath: 'my/endpoint'
    };

    const result = getStatic(request);

    t.assertTrue(!!result.body);
    t.assertEquals(400, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
    t.assertTrue(!(result.headers || {})['Cache-Control']);
    t.assertTrue(!(result.headers || {}).ETag);

    log.info(`OK: ${result.status} - ${result.body}`)
}
exports.testGetStaticStatic_fail_illegalDoubledots_should400 = () => {
    const lib = require('./index');

    const getStatic = lib.static('assets');
    const request = {
        rawPath: 'my/endpoint/trying/to/../hack/this',
        contextPath: 'my/endpoint'
    };

    const result = getStatic(request);

    t.assertTrue(!!result.body);
    t.assertEquals(400, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
    t.assertTrue(!(result.headers || {})['Cache-Control']);
    t.assertTrue(!(result.headers || {}).ETag);

    log.info(`OK: ${result.status} - ${result.body}`)
}
exports.testGetStaticStatic_fail_illegalWildcards_should400 = () => {
    const lib = require('./index');

    const getStatic = lib.static('assets');
    const request = {
        rawPath: 'my/endpoint/trying/to/???/hack/*.this',
        contextPath: 'my/endpoint'
    };

    const result = getStatic(request);

    t.assertTrue(!!result.body, "Should have returned a body in dev mode. Result: " + JSON.stringify(result));
    t.assertEquals(400, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
    t.assertTrue(!(result.headers || {})['Cache-Control']);
    t.assertTrue(!(result.headers || {}).ETag);

    log.info(`OK: ${result.status} - ${result.body}`)
}
exports.testGetStaticStatic_fail_pathNotUnderContextPath_should500 = () => {
    const lib = require('./index');

    const getStatic = lib.static('assets');
    const request = {
        rawPath: 'another/endpoint/trying/to/???/hack/*.this',
        contextPath: 'my/endpoint'
    };

    const result = getStatic(request);

    t.assertTrue(!!result.body);
    t.assertEquals(500, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
    t.assertTrue(!(result.headers || {})['Cache-Control']);
    t.assertTrue(!(result.headers || {}).ETag);

    log.info(`OK: ${result.status} - ${result.body}`)
}


exports.testGetStaticStatic_fail_contentTypeFunc_runtimeError_should500withMessage = () => {
    const lib = require('./index');

    const getStatic = lib.static('assets', {
        contentType: () => {
            throw Error("This will be thrown outside of parsePathAndFunctions. Should still be handled.");
        }
    });

    const request = {
        rawPath: 'my/endpoint/asset-test-target.txt',
        contextPath: 'my/endpoint'
    };

    const result = getStatic(request);

    t.assertTrue(!!result.body);
    t.assertEquals(500, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated

    log.info(`OK: ${result.status} - ${result.body}`)
}
exports.testGetStaticStatic_fail_contentTypeFunc_runtimeError_throwErrors = () => {
    const lib = require('./index');

    const getStatic = lib.static('assets', {
        contentType: () => {
            throw Error("This will be thrown outside of parsePathAndFunctions. Should still be handled.");
        },
        throwErrors: true
    });

    const request = {
        rawPath: 'my/endpoint/asset-test-target.txt',
        contextPath: 'my/endpoint'
    };

    let result = null,
        failed = true;
    try {
        result = getStatic(request);
        failed = false;

    } catch (e) {
        log.info("OK: " + e.message);
    }

    t.assertTrue(failed, "Should have failed. Instead, got a result: " + JSON.stringify(result));
}


exports.testGetStaticStatic_fail_cacheControlFunc_runtimeError_should500withMessage = () => {
    const lib = require('./index');

    const getStatic = lib.static('assets', {
        cacheControl: () => {
            throw Error("This will be thrown outside of parsePathAndFunctions. Should still be handled.");
        }
    });

    const request = {
        rawPath: 'my/endpoint/asset-test-target.txt',
        contextPath: 'my/endpoint'
    };

    const result = getStatic(request);

    t.assertTrue(!!result.body);
    t.assertEquals(500, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated

    log.info(`OK: ${result.status} - ${result.body}`)
}
exports.testGetStaticStatic_fail_cacheControlFunc_runtimeError_throwErrors = () => {
    const lib = require('./index');

    const getStatic = lib.static('assets', {
        cacheControl: () => {
            throw Error("This will be thrown outside of parsePathAndFunctions. Should still be handled.");
        },
        throwErrors: true
    });

    const request = {
        rawPath: 'my/endpoint/asset-test-target.txt',
        contextPath: 'my/endpoint'
    };

    let result = null,
        failed = true;
    try {
        result = getStatic(request);
        failed = false;

    } catch (e) {
        log.info("OK: " + e.message);
    }

    t.assertTrue(failed, "Should have failed. Instead, got a result: " + JSON.stringify(result));
}


// Verify that a even if the getStatic function fails once, it will keep working for new requests later
exports.testGetStaticStatic_fail_failuresShouldNotDestroyGetstaticFunction = () => {
    const lib = require('./index');

    const getStatic = lib.static({
        root: 'static',
        getCleanPath: req => req.rawPath.substring('my/endpoint'.length)
    });

    let result;

    result = getStatic({rawPath: 'my/endpoint/static-test-text.txt'});                // <-- This and many below are fine, those should keep working on the same path
    t.assertEquals(200, result.status, "Expected 200 OK. Result: " + JSON.stringify(result));

    result = getStatic({rawPath: 'my/endpoint/bad<character'});
    t.assertTrue(result.status >= 400, "Expected a failing getStatic call: illegal char '<'. Result: " + JSON.stringify(result));
    log.info(`OK: ${result.status} - ${result.body}`);

    result = getStatic({rawPath: 'my/endpoint/static-test-css.css'});
    t.assertEquals(200, result.status, "Expected 200 OK. Result: " + JSON.stringify(result));

    result = getStatic({rawPath: 'my/endpoint/static-test-json.json'});
    t.assertEquals(200, result.status, "Expected 200 OK. Result: " + JSON.stringify(result));

    result = getStatic({rawPath: 'my/endpoint/bad>character'});
    t.assertTrue(result.status >= 400, "Expected a failing getStatic call: illegal char '>'. Result: " + JSON.stringify(result));
    log.info(`OK: ${result.status} - ${result.body}`);

    result = getStatic({rawPath: 'my/endpoint/bad/../characters'});
    t.assertTrue(result.status >= 400, "Expected a failing getStatic call: illegal chars '..'. Result: " + JSON.stringify(result));
    log.info(`OK: ${result.status} - ${result.body}`);

    result = getStatic({rawPath: 'my/endpoint/w3c_home.gif'});
    t.assertEquals(200, result.status, "Expected 200 OK. Result: " + JSON.stringify(result));

    result = getStatic({rawPath: 'my/endpoint/w3c_no_exist.gif'});
    t.assertTrue(result.status >= 400, "Expected a failing getStatic call: not exist. Result: " + JSON.stringify(result));
    log.info(`OK: ${result.status} - ${result.body}`);

    result = getStatic({rawPath: 'my/endpoint/w3c_home.gif'});
    t.assertEquals(200, result.status, "Expected 200 OK. Result: " + JSON.stringify(result));

    result = getStatic({rawPath: 'my/endpoint/'});
    t.assertTrue(result.status >= 400, "Expected a failing getStatic call: missing path. Result: " + JSON.stringify(result));
    log.info(`OK: ${result.status} - ${result.body}`);

    result = getStatic({rawPath: 'my/endpoint/w3c_home.jpg'});
    t.assertEquals(200, result.status, "Expected 200 OK. Result: " + JSON.stringify(result));

    result = getStatic({rawPath: 'why/is/this/here'});
    t.assertTrue(result.status >= 400, "Expected a failing getStatic call: path not under contextPath. Result: " + JSON.stringify(result));
    log.info(`OK: ${result.status} - ${result.body}`);

}
//*/
