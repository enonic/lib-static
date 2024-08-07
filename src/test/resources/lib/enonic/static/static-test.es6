const constants = require('/lib/enonic/static/constants');
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
                                                                                                                        if (verbose) log.info("Mocked isDev: " + JSON.stringify(params.isDev, null, 2));
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

                                                                                                                        if (verbose) log.info("Mocked io.getResource(" + JSON.stringify(path) + "): " + JSON.stringify(data, null, 2));
            return res;
        }
    );
    mockedIoFuncs.readText = io.readText || (
        (stream) => {
            const text = io.text || ioMock.readText(stream);
                                                                                                                        if (verbose) log.info("Mocked io.readText(stream): " + JSON.stringify(text, null, 2));
            return text;
        }
    );
    mockedIoFuncs.getMimeType = io.getMimeType || (
        (name) => {
            const mimeType = io.mimeType || ioMock.getMimeType(name);
                                                                                                                        if (verbose) log.info("Mocked io.getMimeType(" + JSON.stringify(name) + "): " + JSON.stringify(mimeType, null, 2));
            return mimeType;
        }
    );
    mockIo();



    const etagReader = params.etagReader || {};
    mockedEtagreaderFuncs.read = etagReader.read || (
        (path, etagOverride) => {
            const etag = etagReader.etag || "MockedETagPlaceholder";
                                                                                                                        if (verbose) log.info("Mocked etagReader.read(" + JSON.stringify({path, etagOverride}) + "): " + JSON.stringify(etag, null, 2));
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
            : () => constants.DEFAULT_CACHE_CONTROL
    };
    mockedOptionsparserFuncs.parsePathAndOptions = optionParams.parsePathAndOptions || (
        (pathOrOptions, options) => {
            const parsed = (typeof pathOrOptions === 'string')
                ? { path: pathOrOptions, ...defaultOptions, ...options, ...optionParams }
                : { ...defaultOptions, ...pathOrOptions, ...optionParams };
                                                                                                                        if (verbose) log.info("Mocked parseRootAndOptions(" + JSON.stringify({pathOrOptions, options}) + "): " + JSON.stringify(parsed, null, 2));
            return parsed;
        }
    );
    mockedOptionsparserFuncs.parseRootAndOptions = optionParams.parseRootAndOptions || (
        (rootOrOptions, options) => {
            const parsed = (typeof rootOrOptions === 'string')
                ? { root: rootOrOptions, ...defaultOptions, ...options, ...optionParams }
                : { ...defaultOptions, ...rootOrOptions, ...optionParams };
                                                                                                                        if (verbose) log.info("Mocked parseRootAndOptions(" + JSON.stringify({rootOrOptions, options}) + "): " + JSON.stringify(parsed, null, 2));
            return parsed;
        }
    );
    mockOptionsparser();
}





const verbose = false;













//////////////////////////////////////////////////////////////////  TEST .buildGetter innerbehaviour

exports.testbuildGetter_innerbehavior_1arg_parseRootAndOptions_isCalled = () => {
    // const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestbuildGetter_innerbehavior_1arg_parseRootAndOptions_isCalled:\n");
    let parseRootAndOptionsWasCalled = false;
    doMocks({
            options: {
                parseRootAndOptions: (rootOrOptions, options) => {
                                                                                                                        if (verbose) log.info("parseRootAndOptions call - rootOrOptions: " + JSON.stringify(rootOrOptions, null, 2));
                                                                                                                        if (verbose) log.info("parseRootAndOptions call - options: " + JSON.stringify(options, null, 2));

                    // Verify that the arguments of .buildGetter are passed into parseRootAndOptions the expected way:
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

    const getStatic = lib.buildGetter({
        root: 'my/root',
        throwErrors: 'throwErrors/should/be/boolean/but/ok',
        cacheControl: 'cacheControl/string/or/function/but/ok',
        contentType: 'contentType/string/object/or/function/but/ok',
        etag: 'etag/should/be/boolean/but/ok',
        getCleanPath: 'getCleanPath/should/be/function/but/ok'
    });
                                                                                                                        if (verbose) log.info("getStatic: " + JSON.stringify(getStatic, null, 2));
    t.assertTrue(parseRootAndOptionsWasCalled, "parseRootAndOptionsWasCalled");
};

exports.testbuildGetter_innerbehavior_2arg_parseRootAndOptions_isCalled = () => {
    // const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestbuildGetter_innerbehavior_2arg_parseRootAndOptions_isCalled:\n");
    let parseRootAndOptionsWasCalled = false;
    doMocks({
            options: {
                parseRootAndOptions: (rootOrOptions, options) => {
                                                                                                                        if (verbose) log.info("parseRootAndOptions call - rootOrOptions: " + JSON.stringify(rootOrOptions, null, 2));
                                                                                                                        if (verbose) log.info("parseRootAndOptions call - options: " + JSON.stringify(options, null, 2));

                    // Verify that the arguments of .buildGetter are passed into parseRootAndOptions the expected way:
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

    const getStatic = lib.buildGetter(
        'my/root',
        {
            throwErrors: 'throwErrors/should/be/boolean/but/ok',
            cacheControl: 'cacheControl/string/or/function/but/ok',
            contentType: 'contentType/string/object/or/function/but/ok',
            etag: 'etag/should/be/boolean/but/ok',
            getCleanPath: 'getCleanPath/should/be/function/but/ok'
        }
    );
                                                                                                                        if (verbose) log.info("getStatic: " + JSON.stringify(getStatic, null, 2));
    t.assertTrue(parseRootAndOptionsWasCalled, "parseRootAndOptionsWasCalled");
};

exports.testbuildGetter_innerbehavior_parseRootAndOptions_errorMessage_shouldThrowError = () => {
    // const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestbuildGetter_innerbehavior_parseRootAndOptions_errorMessage_shouldThrowError:\n");

    doMocks({
            options: {
                errorMessage: "Throw this error on purpose, should be logged but not output"
            },
        },
        verbose);

    let failed = true;
    try {
        const getStatic = lib.buildGetter("my/root");
        failed = false;
                                                                                                                        if (verbose) log.info("getStatic: " + JSON.stringify(getStatic, null, 2));
    } catch (e) {
                                                                                                                        if (verbose) log.error(e);
        t.assertTrue(e.message.indexOf("on purpose") > -1, "Expected purposefully thrown error");
    }

    t.assertTrue(failed, "Should have failed on error message from parseRootAndOptions");

    log.info("OK.");
};



exports.testbuildGetter_innerbehavior_parseRootAndOptions_outputs_areUsed = () => {
    // const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestbuildGetter_innerbehavior_parseRootAndOptions_outputs_areUsed:\n");
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

    const getStatic = lib.buildGetter('arg/root/in', {
        etag: 'arg/etag/in',
        cacheControl: 'arg/cacheControl/in',
        contentType: 'arg/contentType/in'
    });
                                                                                                                        if (verbose) log.info("getStatic: " + JSON.stringify(getStatic, null, 2));
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


exports.testbuildGetter_root_noLeadingSlash_isOK = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestbuildGetter_root_noLeadingSlash_isOK:\n");
    doMocks({}, verbose);

    const getStatic = lib.buildGetter('i/am/root');

    const result = getStatic({
        rawPath: '/assets/asset-test-target.txt',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(200, result.status, "result.status");
    t.assertEquals("Mocked content of '/i/am/root/asset-test-target.txt'", ioMock.readText(result.body), "result.body");
};


exports.testbuildGetter_root_trailingSlash_isOK = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestbuildGetter_root_trailingSlash_isOK:\n");
    doMocks({}, verbose);

    const getStatic = lib.buildGetter('i/am/root/');

    const result = getStatic({
        rawPath: '/assets/asset-test-target.txt',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(200, result.status, "result.status");
    t.assertEquals("Mocked content of '/i/am/root/asset-test-target.txt'", ioMock.readText(result.body), "result.body");
};

exports.testGetStatic_rawPath_noLeadingSlash_isOK = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_rawPath_noLeadingSlash_isOK:\n");
    doMocks({}, verbose);

    const getStatic = lib.buildGetter('i/am/root');

    const result = getStatic({
        rawPath: 'assets/asset-test-target.txt',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(200, result.status, "result.status");
    t.assertEquals("Mocked content of '/i/am/root/asset-test-target.txt'", ioMock.readText(result.body), "result.body");
};


exports.testGetStatic_contextPath_trailingSlash_isOK = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_contextPath_trailingSlash_isOK:\n");
    doMocks({}, verbose);

    const getStatic = lib.buildGetter('i/am/root/');

    const result = getStatic({
        rawPath: '/assets/asset-test-target.txt',
        contextPath: 'assets/'
    });
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(200, result.status, "result.status");
    t.assertEquals("Mocked content of '/i/am/root/asset-test-target.txt'", ioMock.readText(result.body), "result.body");
};

exports.testGetStatic_contextPath_noLeadingSlash_isOK = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_contextPath_noLeadingSlash_isOK:\n");
    doMocks({}, verbose);

    const getStatic = lib.buildGetter('i/am/root/');

    const result = getStatic({
        rawPath: '/assets/asset-test-target.txt',
        contextPath: 'assets'
    });
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(200, result.status, "result.status");
    t.assertEquals("Mocked content of '/i/am/root/asset-test-target.txt'", ioMock.readText(result.body), "result.body");
};

exports.testGetStatic_request_noLeadingSlashes_isOK = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_request_noLeadingSlashes_isOK:\n");
    doMocks({}, verbose);

    const getStatic = lib.buildGetter('i/am/root/');

    const result = getStatic({
        rawPath: 'assets/asset-test-target.txt',
        contextPath: 'assets'
    });
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(200, result.status, "result.status");
    t.assertEquals("Mocked content of '/i/am/root/asset-test-target.txt'", ioMock.readText(result.body), "result.body");
};

exports.testGetStatic_request_otherSlashes_isOK = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_request_otherSlashes_isOK:\n");
    doMocks({}, verbose);

    const getStatic = lib.buildGetter('i/am/root/');

    const result = getStatic({
        rawPath: 'assets/asset-test-target.txt',
        contextPath: 'assets/'
    });
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(200, result.status, "result.status");
    t.assertEquals("Mocked content of '/i/am/root/asset-test-target.txt'", ioMock.readText(result.body), "result.body");
};




//////////////////////////////////////////////////////////////////  TEST getStatic


// Path string argument

exports.testGetStatic_root_string_FullDefaultResponse = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_root_string_FullDefaultResponse:\n");
    doMocks({}, verbose);

    const getStatic = lib.buildGetter('/i/am/root');

    const result = getStatic({
        rawPath: '/assets/asset-test-target.txt',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));
    t.assertEquals(200, result.status, "result.status");
    t.assertEquals("Mocked content of '/i/am/root/asset-test-target.txt'", ioMock.readText(result.body), "result.body");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain'");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain'");

    t.assertTrue(!!result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals('object', typeof result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals( "MockedETagPlaceholder", result.headers.ETag, "result.headers should be an object with ETag and Cache-Control");
    t.assertTrue(result.headers.ETag.length > 0, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals(constants.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"], "result.headers should be an object with ETag and Cache-Control");
};

exports.testGetStatic_root_option_FullDefaultResponse = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_root_option_FullDefaultResponse:\n");
    doMocks({}, verbose);

    const getStatic = lib.buildGetter({root: '/i/am/root'});

    const result = getStatic({
        rawPath: '/assets/asset-test-target.txt',
        contextPath: '/assets'
    });                                                                                                                 if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(200, result.status, "result.status");
    t.assertEquals("Mocked content of '/i/am/root/asset-test-target.txt'", ioMock.readText(result.body), "result.body");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain'");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain'");

    t.assertTrue(!!result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals('object', typeof result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals( "MockedETagPlaceholder", result.headers.ETag, "result.headers should be an object with ETag and Cache-Control");
    t.assertTrue(result.headers.ETag.length > 0, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals(constants.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"], "result.headers should be an object with ETag and Cache-Control");

};

exports.testGetStatic_DEV_root_string_FullDefaultResponse = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_DEV_root_string_FullDefaultResponse:\n");
    doMocks({isDev: true}, verbose);

    const getStatic = lib.buildGetter('/i/am/root');

    const result = getStatic({
        rawPath: '/assets/asset-test-target.txt',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(200, result.status, "result.status");
    t.assertEquals("Mocked content of '/i/am/root/asset-test-target.txt'", ioMock.readText(result.body), "result.body");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain'");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain'");

    t.assertTrue(!!result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals('object', typeof result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals( "MockedETagPlaceholder", result.headers.ETag, "result.headers should be an object with ETag and Cache-Control");
    t.assertTrue(result.headers.ETag.length > 0, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals(constants.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"], "result.headers should be an object with ETag and Cache-Control");
};

exports.testGetStatic_DEV_root_option_FullDefaultResponse = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_DEV_root_option_FullDefaultResponse:\n");
    doMocks({isDev: true}, verbose);

    const getStatic = lib.buildGetter({root: '/i/am/root'});

    const result = getStatic({
        rawPath: '/assets/asset-test-target.txt',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(200, result.status, "result.status");
    t.assertEquals("Mocked content of '/i/am/root/asset-test-target.txt'", ioMock.readText(result.body), "result.body");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain'");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain'");

    t.assertTrue(!!result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals('object', typeof result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals( "MockedETagPlaceholder", result.headers.ETag, "result.headers should be an object with ETag and Cache-Control");
    t.assertTrue(result.headers.ETag.length > 0, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals(constants.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"], "result.headers should be an object with ETag and Cache-Control");
};


// Tests that the contentTypeFunc returned from parseRootAndOptions is used as expected, and on repeated getStatic calls.
// Fallback to built-in type detection when the function returns null is not tested here, but as part of parseRootAndOptions.
exports.testGetStatic_contentType = () => {
                                                                                                                        if (verbose) log.info("\n\n\ttestGetStatic_contentType:\n");
    doMocks({
            options: {
                contentTypeFunc: (filePathAndName, resource) => {
                                                                                                                        if (verbose) log.info("contentTypeFunc.filePathAndName: " + JSON.stringify(filePathAndName, null, 2));
                                                                                                                        if (verbose) log.info("contentTypeFunc.resource: " + JSON.stringify(resource, null, 2));
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

    const getStatic = lib.buildGetter({root: '/i/am/root'});

    // .txt

    const result1 = getStatic({
        rawPath: '/assets/asset-test-target.txt',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info("result1: " + JSON.stringify(result1, null, 2));

    t.assertEquals(200, result1.status, "result1.status");

    t.assertEquals('string', typeof result1.contentType, "Expected result1 string contentType containing 'teKSt/html'");
    t.assertTrue(result1.contentType.indexOf("teczt/playn") !== -1, "Expected result1 string contentType containing 'teczt/playn'");

    // .html

    const result2 = getStatic({
        rawPath: '/assets/asset-test-target.html',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info("result2: " + JSON.stringify(result2, null, 2));

    t.assertEquals(200, result2.status, "result2.status");

    t.assertEquals('string', typeof result2.contentType, "Expected result2 string contentType containing 'teKSt/html'");
    t.assertTrue(result2.contentType.indexOf("teKSt/html") !== -1, "Expected result2 string contentType containing 'teKSt/html'");

    // .json: verifies that the resource object is available in the contentTypeFunc function

    const result3 = getStatic({
        rawPath: '/assets/asset-test-target.json',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info("result3: " + JSON.stringify(result3, null, 2));

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
                                                                                                                        if (verbose) log.info("cacheControlFunc.filePathAndName: " + JSON.stringify(filePathAndName, null, 2));
                                                                                                                        if (verbose) log.info("cacheControlFunc.resource: " + JSON.stringify(resource, null, 2));
                                                                                                                        if (verbose) log.info("cacheControlFunc.mimeType: " + JSON.stringify(mimeType, null, 2));
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

    const getStatic = lib.buildGetter({root: '/i/am/root'});

    // .txt

    const result1 = getStatic({
        rawPath: '/assets/asset-test-target.txt',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info("result1: " + JSON.stringify(result1, null, 2));

    t.assertEquals(200, result1.status, "result1.status");

    t.assertEquals('string', typeof result1.headers['Cache-Control'], "Expected result1 string cacheControl containing 'txttxttxt'");
    t.assertTrue(result1.headers['Cache-Control'].indexOf("txttxttxt") !== -1, "Expected result1 string cacheControl containing 'txttxttxt'");

    // .html

    const result2 = getStatic({
        rawPath: '/assets/asset-test-target.html',
        contextPath: '/assets'
    });
    if (verbose) log.info("result2: " + JSON.stringify(result2, null, 2));

    t.assertEquals(200, result2.status, "result2.status");

    t.assertEquals('string', typeof result2.headers['Cache-Control'], "Expected result2 string cacheControl containing 'htmlthmlhtml'");
    t.assertTrue(result2.headers['Cache-Control'].indexOf("htmlthmlhtml") !== -1, "Expected result2 string cacheControl containing 'htmlthmlhtml'");


    // .json: verifies that both the resource object and the detected mime type is available in the cacheControlFunc function

    const result3 = getStatic({
        rawPath: '/assets/asset-test-target.json',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info("result3: " + JSON.stringify(result3, null, 2));

    t.assertEquals(200, result3.status, "result3.status");

    t.assertEquals('string', typeof result3.headers['Cache-Control'], "Expected result3 string cacheControl containing 'has-resource-application/json'");
    t.assertTrue(result3.headers['Cache-Control'].indexOf("has-resource-application/json") !== -1, "Expected result3 string cacheControl containing 'has-resource-application/json'");
}


// Getcleanpath function can extract clean path from request in a custom manner, and be used repeatedly with getStatic:
exports.testGetStatic_getCleanPath = () => {
    // const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ttestGetStatic_getCleanPath:\n");
    doMocks({
            options: {
                getCleanPath: (request) => request.targetPath.substring("/myprefix/".length)
            }
        },
        verbose);

    const getStatic = lib.buildGetter({root: '/i/am/root'});

    // target1

    const result1 = getStatic({
        rawPath: 'irrelevant but must be in the request',
        targetPath: '/myprefix/subfolder/asset-target1.txt',
    });
                                                                                                                        if (verbose) log.info("result1: " + JSON.stringify(result1, null, 2));
                                                                                                                        if (verbose) log.info("result1.body content: " + JSON.stringify(ioMock.readText(result1.body), null, 2));

    t.assertEquals(200, result1.status, "result1.status");
    t.assertTrue(ioMock.readText(result1.body).indexOf("/i/am/root/subfolder/asset-target1.txt") !== -1, "Expected result1 body containing content of '/i/am/root/subfolder/asset-target1.txt'");

    // target2

    const result2 = getStatic({
        rawPath: 'irrelevant but must be in the request',
        targetPath: '/myprefix/asset-target2.txt',
    });
                                                                                                                        if (verbose) log.info("result2: " + JSON.stringify(result2, null, 2));
                                                                                                                        if (verbose) log.info("result2.body content: " + JSON.stringify(ioMock.readText(result2.body), null, 2));

    t.assertEquals(200, result2.status, "result2.status");
    t.assertTrue(ioMock.readText(result2.body).indexOf("/i/am/root/asset-target2.txt") !== -1, "Expected result2 body containing content of '/i/am/root/asset-target2.txt'");

                                                                                                                        if (verbose) t.assertTrue(false, "OK");
};




// .buildGetter problem/error handling:

exports.testGetStatic_root_noExist_shouldOnly404 = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_root_noExist_shouldOnly404:\n");
    doMocks({
            io: {
                exists: false
            }
        },
        verbose);

    const getStatic = lib.buildGetter({root: '/i/am/root'});

    const result = getStatic({
        rawPath: '/assets/asset-test-target.txt',
        contextPath: '/assets'
    });

                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

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

    const getStatic = lib.buildGetter({root: '/i/am/root'});

    const result = getStatic({
        rawPath: '/assets/asset-test-target.txt',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(404, result.status, "result.status");
    t.assertEquals('string', typeof result.body, "Expected string body containing path in dev");
    t.assertTrue(result.body.indexOf('/i/am/root/asset-test-target.txt') !== -1, "Expected string body containing path in dev");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain' in dev");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain' in dev");

    t.assertEquals(undefined, result.headers, "result.headers");
};


exports.testGetStatic_relativePath_slash_indexfallbackExists_shouldFallbackWith200andMustRevalidate = () => {
    //const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_relativePath_slash_indexfallbackExists_shouldFallbackWith200andMustRevalidate:\n");
    doMocks({
        io: {
            getResource: (path) => {
                const data = {
                    path: path,
                    exists: path.endsWith("/index.html") // Mocking: '/i/am/root' will not exist, but '/i/am/root/index.html' will, during the fallback detection
                };
                data.content = `Mocked content of '${path}'`;

                const res = ioMock.getResource(data.path, data.exists, data.content);

                if (verbose) log.info("Mocked io.getResource(" + JSON.stringify(path) + "): " + JSON.stringify(data, null, 2));
                return res;
            }
        }
    }, verbose);

    const getStatic = lib.buildGetter({root: '/i/am/root'});

    const result = getStatic({
        rawPath: '/assets/',        // Trailing slash, compared to contextPath it resolves relativePath to '/'
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(200, result.status, "result.status");
    t.assertEquals("Mocked content of '/i/am/root/index.html'", ioMock.readText(result.body), "result.body");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/html'");
    t.assertTrue(result.contentType.indexOf("text/html") !== -1, "Expected string contentType containing 'text/html'");

    t.assertTrue(!!result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals('object', typeof result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals( "MockedETagPlaceholder", result.headers.ETag, "result.headers should be an object with ETag and 'no-cache' Cache-Control");
    t.assertTrue(result.headers.ETag.length > 0, "result.headers should be an object with ETag and 'no-cache' Cache-Control");
    t.assertEquals(constants.INDEXFALLBACK_CACHE_CONTROL, result.headers["Cache-Control"], "result.headers should be an object with ETag and 'no-cache' Cache-Control");

    t.assertEquals(undefined, result.redirect, "result.redirect");

                                                                                                                        if (verbose) t.assertTrue(false, "OK");
}

exports.testGetStatic_relativePath_slash_fallbackNotExist_shouldOnly404 = () => {
    //const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_relativePath_slash_fallbackNotExist_shouldOnly404:\n");
    doMocks({
        io: {
            exists: false
        }
    }, verbose);

    const getStatic = lib.buildGetter({root: '/i/am/root'});

    const result = getStatic({
        rawPath: '/assets/',        // Trailing slash, compared to contextPath it resolves relativePath to '/'
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(404, result.status, "result.status");

    t.assertEquals(undefined, result.body, "result.body");
    t.assertEquals(undefined, result.contentType, "result.contentType");
    t.assertEquals(undefined, result.headers, "result.headers");
    t.assertEquals(undefined, result.redirect, "result.redirect");

                                                                                                                        if (verbose) t.assertTrue(false, "OK");
}

exports.testGetStatic_DEV_relativePath_slash_fallbackNotExist_should404withInfo = () => {
    //const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_DEV_relativePath_slash_fallbackNotExist_should404withInfo:\n");
    doMocks({
        isDev: true,
        io: {
            exists: false
        }
    }, verbose);

    const getStatic = lib.buildGetter({root: '/i/am/root'});

    const result = getStatic({
        rawPath: '/assets/',        // Trailing slash, compared to contextPath it resolves relativePath to '/'
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(404, result.status, "result.status");

    t.assertEquals('string', typeof result.body, "Expected string body containing path in dev");
    t.assertTrue(result.body.indexOf('/i/am/root/') !== -1, "Expected string body containing path in dev");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain' in dev");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain' in dev");

    t.assertEquals(undefined, result.headers, "result.headers");
    t.assertEquals(undefined, result.redirect, "result.redirect");

                                                                                                                        if (verbose) t.assertTrue(false, "OK");
}


exports.testGetStatic_relativePath_empty_fallbackExists_shouldRedirectToSlash = () => {
    //const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_relativePath_empty_fallbackExists_shouldRedirectToSlash:\n");
    doMocks({
        io: {
            getResource: (path) => {
                const data = {
                    path: path,
                    exists: path.endsWith("/index.html") // Mocking: '/i/am/root' will not exist, but '/i/am/root/index.html' will, during the fallback detection
                };
                data.content = `Mocked content of '${path}'`;

                const res = ioMock.getResource(data.path, data.exists, data.content);

                                                                                                                        if (verbose) log.info("Mocked io.getResource(" + JSON.stringify(path) + "): " + JSON.stringify(data, null, 2));
                return res;
            }
        }
    }, verbose);

    const getStatic = lib.buildGetter({root: '/i/am/root'});

    const result = getStatic({
        path: '/targetRedirect/assets', // path, not rawPath, is the basis for the redirect.
        rawPath: '/assets',         // No trailing slash, compared with contextPath it will resolve relativePath to ''
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals('/targetRedirect/assets/', result.redirect, "result.redirect");

    t.assertEquals(undefined, result.status, "result.status");
    t.assertEquals(undefined, result.body, "result.body");
    t.assertEquals(undefined, result.contentType, "result.contentType");
    t.assertEquals(undefined, result.headers, "result.headers");

                                                                                                                        if (verbose) t.assertTrue(false, "OK");
}

exports.testGetStatic_relativePath_empty_fallbackNotExist_shouldOnly404 = () => {
    //const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_relativePath_empty_fallbackNotExist_shouldOnly404:\n");
    doMocks({
        io: {
            exists: false
        }
    }, verbose);

    const getStatic = lib.buildGetter({root: '/i/am/root'});

    const result = getStatic({
        rawPath: '/assets',         // No trailing slash
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(404, result.status, "result.status");

    t.assertEquals(undefined, result.body, "result.body");
    t.assertEquals(undefined, result.contentType, "result.contentType");
    t.assertEquals(undefined, result.headers, "result.headers");
    t.assertEquals(undefined, result.redirect, "result.redirect");

                                                                                                                        if (verbose) t.assertTrue(false, "OK");
}

exports.testGetStatic_DEV_relativePath_empty_fallbackNotExist_should404withInfo = () => {
    //const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_DEV_relativePath_empty_fallbackNotExist_should404withInfo:\n");
    doMocks({
        isDev: true,
        io: {
            exists: false
        }
    }, verbose);

    const getStatic = lib.buildGetter({root: '/i/am/root'});

    const result = getStatic({
        rawPath: '/assets',         // No trailing slash
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(404, result.status, "result.status");

    t.assertEquals('string', typeof result.body, "Expected string body containing path in dev");
    t.assertTrue(result.body.indexOf('/i/am/root') !== -1, "Expected string body containing path in dev");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain' in dev");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain' in dev");

    t.assertEquals(undefined, result.headers, "result.headers");
    t.assertEquals(undefined, result.redirect, "result.redirect");

                                                                                                                        if (verbose) t.assertTrue(false, "OK");
}




exports.testGetStatic_relativePath_illegalChars_shouldOnly400 = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_relativePath_illegalChars_shouldOnly400:\n");
    doMocks({}, verbose);

    const getStatic = lib.buildGetter({root: '/i/am/root'});

    const result1 = getStatic({
        rawPath: '/assets/../asset-test-target/.txt',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result1, null, 2));

    t.assertEquals(400, result1.status, "result1.status");

    t.assertEquals(undefined, result1.body, "result1.body");
    t.assertEquals(undefined, result1.contentType, "result1.contentType");
    t.assertEquals(undefined, result1.headers, "result1.headers");


    const result2 = getStatic({
        rawPath: '/assets/asset<test-target/.txt',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info("result2: " + JSON.stringify(result2, null, 2));

    t.assertEquals(400, result2.status, "result2.status");

    t.assertEquals(undefined, result2.body, "result2.body");
    t.assertEquals(undefined, result2.contentType, "result2.contentType");
    t.assertEquals(undefined, result2.headers, "result2.headers");


    const result3 = getStatic({
        rawPath: '/assets/asset:test-target/.txt',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info("result3: " + JSON.stringify(result3, null, 2));

    t.assertEquals(400, result3.status, "result3.status");

    t.assertEquals(undefined, result3.body, "result3.body");
    t.assertEquals(undefined, result3.contentType, "result3.contentType");
    t.assertEquals(undefined, result3.headers, "result3.headers");
}


exports.testGetStatic_DEV_relativePath_illegalChars_should400WithInfo = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_DEV_relativePath_illegalChars_should400WithInfo:\n");
    doMocks({ isDev: true }, verbose);

    const getStatic = lib.buildGetter({root: '/i/am/root'});

    const result1 = getStatic({
        rawPath: '/assets/../asset-test-target/.txt',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info("result1: " + JSON.stringify(result1, null, 2));

    t.assertEquals(400, result1.status, "result1.status");

    t.assertEquals('string', typeof result1.body, "Expected result1 string body with error message in dev");

    t.assertEquals('string', typeof result1.contentType, "Expected result1 string contentType containing 'text/plain' in dev");
    t.assertTrue(result1.contentType.indexOf("text/plain") !== -1, "Expected result1 string contentType containing 'text/plain' in dev");

    t.assertEquals(undefined, result1.headers, "result1.headers");



    const result2 = getStatic({
        rawPath: '/assets/asset\\test-target/.txt',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info("result2: " + JSON.stringify(result2, null, 2));

    t.assertEquals(400, result2.status, "result2.status");

    t.assertEquals('string', typeof result2.body, "Expected result2 string body with error message in dev");

    t.assertEquals('string', typeof result2.contentType, "Expected result2 string contentType containing 'text/plain' in dev");
    t.assertTrue(result2.contentType.indexOf("text/plain") !== -1, "Expected result2 string contentType containing 'text/plain' in dev");

    t.assertEquals(undefined, result2.headers, "result2.headers");



    const result3 = getStatic({
        rawPath: '/assets/asset:test-target/.txt',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info("result3: " + JSON.stringify(result3, null, 2));

    t.assertEquals(400, result3.status, "result3.status");

    t.assertEquals('string', typeof result3.body, "Expected result3 string body with error message in dev");

    t.assertEquals('string', typeof result3.contentType, "Expected result3 string contentType containing 'text/plain' in dev");
    t.assertTrue(result3.contentType.indexOf("text/plain") !== -1, "Expected result3 string contentType containing 'text/plain' in dev");

    t.assertEquals(undefined, result3.headers, "result3.headers");
}


exports.testGetStatic_noRawPath_should500 = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_noRawPath_should500:\n");
    doMocks({ isDev: true }, verbose);

    const getStatic = lib.buildGetter({root: '/i/am/root'});

    const result = getStatic({
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

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

    const getStatic = lib.buildGetter({root: '/i/am/root'});

    const result = getStatic({
        rawPath: '/assets/asset-test-target.txt',
    });
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(500, result.status, "result.status");

    t.assertEquals('string', typeof result.body, "Expected string body with error message in dev");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain' in dev");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain' in dev");

    t.assertEquals(undefined, result.headers, "result.headers");
}


exports.testGetStatic_outsideContextPath_should500 = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_outsideContextPath_should500:\n");
    doMocks({ isDev: true }, verbose);

    const getStatic = lib.buildGetter({root: '/i/am/root'});

    const result = getStatic({
        rawPath: 'assets/asset-test-target.txt',
        contextPath: 'my/endpoint'
    });
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

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

    const getStatic = lib.buildGetter({root: '/i/am/root'});

    let failed = true;
    try {
        const result = getStatic({
            rawPath: '/assets/asset-test-target.txt',
        });
        failed = false;
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));
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

    const getStatic = lib.buildGetter({root: '/i/am/root'});

    const result = getStatic({
        rawPath: '/assets/asset-test-target.txt',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

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

    const getStatic = lib.buildGetter({root: '/i/am/root'});

    let failed = true;
    try {
        const result = getStatic({
            rawPath: '/assets/asset-test-target.txt',
            contextPath: '/assets'
        });
        failed = false;
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));
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

    const getStatic = lib.buildGetter({root: '/i/am/root'});

    const result = getStatic({
        rawPath: '/assets/asset-test-target.txt',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

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

    const getStatic = lib.buildGetter({root: '/i/am/root'});

    let failed = true;
    try {
        const result = getStatic({
            rawPath: '/assets/asset-test-target.txt',
            contextPath: '/assets'
        });
        failed = false;
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));
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

    const getStatic = lib.buildGetter({root: '/i/am/root'});

    const result = getStatic({
        rawPath: '/assets/asset-test-target.txt',
        contextPath: '/assets'
    });
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

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

    const getStatic = lib.buildGetter({root: '/i/am/root'});

    let failed = true;
    try {
        const result = getStatic({
            rawPath: '/assets/asset-test-target.txt',
            contextPath: '/assets'
        });
        failed = false;
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));
    } catch (e) {
                                                                                                                        if (verbose) log.error(e);
        t.assertTrue(e.message.indexOf("on purpose") > -1, "Thrown error should have been on purpose");
    }

    t.assertTrue(failed, "Should have thrown error instead of yielding a 500-type response");
    log.info("OK.");
}


exports.testGetStatic_ifMatchingEtag_should304 = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_ifMatchingEtag_should304:\n");

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

    const getStatic = lib.buildGetter('/i/am/root/');

    const result = getStatic({
        rawPath: 'my/endpoint/asset-test-target.txt',
        contextPath: 'my/endpoint',
        headers: {
            'If-None-Match': 'test-etag-value'
        }
    });
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(304, result.status, "result.status");

    t.assertEquals(undefined, result.body, "result.body");
    t.assertEquals(undefined, result.contentType, "result.contentType");
    t.assertEquals(undefined, result.headers, "result.headers");
};


exports.testGetStatic_ifNotMatchingEtag_shouldProceedWithAssetRead = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_ifNotMatchingEtag_shouldProceedWithAssetRead:\n");

    doMocks(
        {
            etagReader: {
                read: () => "CURRENT-etag-value"
            }
        },
        verbose
    );

    const getStatic = lib.buildGetter('/i/am/root/');

    const result = getStatic({
        rawPath: 'my/endpoint/asset-test-target.txt',
        contextPath: 'my/endpoint',
        headers: {
            'If-None-Match': 'OLD-etag-value'
        }
    });
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(200, result.status, "result.status");

    t.assertTrue(ioMock.readText(result.body).indexOf("/i/am/root/asset-test-target.txt") !== -1, "result.body");
    t.assertEquals("text/plain", result.contentType, "result.contentType");
    t.assertEquals("CURRENT-etag-value", result.headers.ETag, "result.headers.ETag");
};


// Verify that a even if the getStatic function fails once, it will keep working for new requests later
exports.testGetStatic_fail_failuresShouldNotDestroyGetstaticFunction = () => {
    //const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGetStatic_fail_failuresShouldNotDestroyGetstaticFunction:\n");

    doMocks({}, verbose);

    const getStatic = lib.buildGetter('i/am/root');

    let result;

    result = getStatic({rawPath: 'my/endpoint/static-test-text.txt', contextPath: 'my/endpoint'});                // <-- This and many below are fine, those should keep working on the same path
    t.assertEquals(200, result.status, "Expected 200 OK. Result: " + JSON.stringify(result));
                                                                                                                        if (verbose) log.info(`OK: ${result.status} - ${result.body}`);

    result = getStatic({rawPath: 'my/endpoint/bad<character', contextPath: 'my/endpoint'});
    t.assertTrue(result.status >= 400, "Expected a failing getStatic call: illegal char '<'. Result: " + JSON.stringify(result));
                                                                                                                        if (verbose) log.info(`OK: ${result.status} - ${result.body}`);

    result = getStatic({rawPath: 'my/endpoint/static-test-css.css', contextPath: 'my/endpoint'});
    t.assertEquals(200, result.status, "Expected 200 OK. Result: " + JSON.stringify(result));

    result = getStatic({rawPath: 'my/endpoint/static-test-json.json', contextPath: 'my/endpoint'});
    t.assertEquals(200, result.status, "Expected 200 OK. Result: " + JSON.stringify(result));

    result = getStatic({rawPath: 'my/endpoint/bad>character', contextPath: 'my/endpoint'});
    t.assertTrue(result.status >= 400, "Expected a failing getStatic call: illegal char '>'. Result: " + JSON.stringify(result));
                                                                                                                        if (verbose) log.info(`OK: ${result.status} - ${result.body}`);

    result = getStatic({rawPath: 'my/endpoint/bad/../characters', contextPath: 'my/endpoint'});
    t.assertTrue(result.status >= 400, "Expected a failing getStatic call: illegal chars '..'. Result: " + JSON.stringify(result));
                                                                                                                        if (verbose) log.info(`OK: ${result.status} - ${result.body}`);

    result = getStatic({rawPath: 'my/endpoint/w3c_home.gif', contextPath: 'my/endpoint'});
    t.assertEquals(200, result.status, "Expected 200 OK. Result: " + JSON.stringify(result));


    doMocks(
        {
            io: {
                exists: false
            }
        },
        verbose);
    result = getStatic({rawPath: 'my/endpoint/w3c_no_exist.gif', contextPath: 'my/endpoint'});
    t.assertTrue(result.status >= 400, "Expected a failing getStatic call: not exist. Result: " + JSON.stringify(result));
                                                                                                                        if (verbose) log.info(`OK: ${result.status} - ${result.body}`);

    doMocks({}, verbose);
    result = getStatic({rawPath: 'my/endpoint/w3c_home.gif', contextPath: 'my/endpoint'});
    t.assertEquals(200, result.status, "Expected 200 OK. Result: " + JSON.stringify(result));

    doMocks({
        io: {
            getResource: (path) => {
                const data = {
                    path: path,
                    exists: path.endsWith("/index.html") // Mocking: '/i/am/root' will not exist, but '/i/am/root/index.html' will, during the fallback detection
                };
                data.content = `Mocked content of '${path}'`;

                const res = ioMock.getResource(data.path, data.exists, data.content);

                                                                                                                        if (verbose) log.info("Mocked io.getResource(" + JSON.stringify(path) + "): " + JSON.stringify(data, null, 2));
                return res;
            }
        }
    }, verbose);
    result = getStatic({contextPath: 'my/endpoint'});
    																													//if (verbose) log.info("result: " + JSON.stringify(result, null, 2));
    t.assertTrue(result.status >= 400, "Expected a failing getStatic call: missing relative path. Result: " + JSON.stringify(result));
                                                                                                                        if (verbose) log.info(`OK: ${result.status} - ${result.body}`);

    result = getStatic({rawPath: 'my/endpoint/', contextPath: 'my/endpoint'});
                                                                                                                        // if (verbose) log.info("result: " + JSON.stringify(result, null, 2));
    t.assertEquals(200, result.status, "Expected an index fallback, so, 200 OK. Result: " + JSON.stringify(result));
                                                                                                                        if (verbose) log.info(`OK: ${result.status} - ${result.body}`);

    doMocks({}, verbose);
    result = getStatic({rawPath: 'my/endpoint/w3c_home.jpg', contextPath: 'my/endpoint'});
    t.assertEquals(200, result.status, "Expected 200 OK. Result: " + JSON.stringify(result));

    result = getStatic({rawPath: 'why/is/this/here', contextPath: 'my/endpoint'});
    t.assertTrue(400, result.status, "Expected a failing getStatic call: path not under contextPath. Result: " + JSON.stringify(result));
                                                                                                                        if (verbose) log.info(`OK: ${result.status} - ${result.body}`);


    // Even 500-type responses from runtime errors:

    doMocks(
        {
            options: {
                contentTypeFunc: (path) => {
                    if (path.endsWith(".error")) {
                        throw Error("This is a runtime error thrown on purpose, should produce 500");
                    }
                    return "override/text"
                }
            }
        },
        verbose);

    const getStatic2 = lib.buildGetter("assets2");

    result = getStatic2({rawPath: 'my/endpoint/w3c_home.txt', contextPath: 'my/endpoint'});
    t.assertEquals(200, result.status, "no runtime error status");
                                                                                                                        if (verbose) log.info(`OK: ${result.status} - ${result.body}`);

    result = getStatic2({rawPath: 'my/endpoint/w3c_home.error', contextPath: 'my/endpoint'});
    t.assertEquals(500, result.status, "provoked runtime error status");
                                                                                                                        if (verbose) log.info(`OK: ${result.status} - ${result.body}`);

    result = getStatic2({rawPath: 'my/endpoint/w3c_home.gif', contextPath: 'my/endpoint'});
    t.assertEquals(200, result.status, "no runtime error status");
                                                                                                                        if (verbose) log.info(`OK: ${result.status} - ${result.body}`);



    // Even thrown runtime errors:

    doMocks(
        {
            options: {
                contentTypeFunc: (path) => {
                    if (path.endsWith(".error")) {
                        throw Error("This is a runtime error thrown on purpose, should throw");
                    }
                    return "override/text"
                },
                throwErrors: true
            }
        },
        verbose);

    const getStatic3 = lib.buildGetter("assets3");

    result = getStatic3({rawPath: 'my/endpoint/w3c_home.txt', contextPath: 'my/endpoint'});
    t.assertEquals(200, result.status, "no runtime error status");
                                                                                                                        if (verbose) log.info(`OK: ${result.status} - ${result.body}`);

    let failed = true;
    try {
        result = getStatic3({rawPath: 'my/endpoint/w3c_home.error', contextPath: 'my/endpoint'});
        failed = false;
                                                                                                                        if (verbose) log.info(`NOT OK: ${result.status} - ${result.body}`);
    } catch (e) {
                                                                                                                        if (verbose) log.error(e);
        t.assertTrue(e.message.indexOf("on purpose") > -1, "Expected on-purpose thrown error");
    }
    t.assertTrue(failed, "Expected on-purpose thrown error");

    result = getStatic3({rawPath: 'my/endpoint/w3c_home.gif', contextPath: 'my/endpoint'});
    t.assertEquals(200, result.status, "no runtime error status");

                                                                                                                        if (verbose) t.assertTrue(false, "OK");
    log.info(`OK: ${result.status} - ${result.body}`);
}




/*




/////////////  Test getStatic errorHandling




//*/
