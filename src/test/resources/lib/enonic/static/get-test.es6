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
        path: string
        contentTypeFunc: function [(filePathAndName, resource, mimeType) => string]
        cacheControlFunc: function [(filePathAndName, resource) => string]
        cacheControl: string or boolean
        contentType: string or boolean
        etag: string
        throwErrors: boolean
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

//////////////////////////////////////////////////////////////////  TEST .get

exports.testGet_innerbehavior_1arg_parsePathAndOptions_isCalled = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_innerbehavior_1arg_parsePathAndOptions_isCalled:\n");
    let parsePathAndOptionsWasCalled = false;
    doMocks({
            options: {
                parsePathAndOptions: (pathOrOptions, options) => {
                                                                                                                        if (verbose) log.info("parsePathAndOptions call - pathOrOptions: " + JSON.stringify(pathOrOptions, null, 2));
                                                                                                                        if (verbose) log.info("parsePathAndOptions call - options: " + JSON.stringify(options, null, 2));
                    // Verify that the arguments of .get are passed into parsePathAndOptions the expected way:
                    t.assertEquals(undefined, options, "parsePathAndOptions: options");
                    t.assertEquals('object', typeof pathOrOptions , "parsePathAndOptions: pathOrOptions");
                    t.assertEquals(undefined, pathOrOptions.root , "parsePathAndOptions: pathOrOptions.root");
                    t.assertEquals('my/path', pathOrOptions.path , "parsePathAndOptions: pathOrOptions.path");
                    t.assertEquals('throwErrors/should/be/boolean/but/ok', pathOrOptions.throwErrors , "parsePathAndOptions: pathOrOptions.throwErrors");
                    t.assertEquals('cacheControl/string/or/function/but/ok', pathOrOptions.cacheControl , "parsePathAndOptions: pathOrOptions.cacheControl");
                    t.assertEquals('contentType/string/object/or/function/but/ok', pathOrOptions.contentType , "parsePathAndOptions: pathOrOptions.contentType");
                    t.assertEquals('etag/should/be/boolean/but/ok', pathOrOptions.etag , "parsePathAndOptions: pathOrOptions.etag");
                                                                                                                        if (verbose) log.info("Correct call.");
                    // Verify to the caller that this mock function was actually called and the above was verified:
                    parsePathAndOptionsWasCalled = true;

                    // Not testing returns, just returning something to prevent false-negative-looking error log.
                    return {
                        path: pathOrOptions.path,
                        contentTypeFunc: () => pathOrOptions.contentType,
                        cacheControlFunc: () => pathOrOptions.cacheControl
                    };
                },
            }
        },
        verbose);

    const result = lib.get({
        path: 'my/path',
        throwErrors: 'throwErrors/should/be/boolean/but/ok',
        cacheControl: 'cacheControl/string/or/function/but/ok',
        contentType: 'contentType/string/object/or/function/but/ok',
        etag: 'etag/should/be/boolean/but/ok'
    });
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));
    t.assertTrue(parsePathAndOptionsWasCalled, "parsePathAndOptionsWasCalled");
};

exports.testGet_innerbehavior_2arg_parsePathAndOptions_isCalled = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_innerbehavior_2arg_parsePathAndOptions_isCalled:\n");
    let parsePathAndOptionsWasCalled = false;
    doMocks({
            options: {
                parsePathAndOptions: (pathOrOptions, options) => {
                                                                                                                        if (verbose) log.info("parsePathAndOptions call - pathOrOptions: " + JSON.stringify(pathOrOptions, null, 2));
                                                                                                                        if (verbose) log.info("parsePathAndOptions call - options: " + JSON.stringify(options, null, 2));
                    // Verify that the arguments of .get are passed into parsePathAndOptions the expected way:
                    t.assertEquals('object', typeof options, "parsePathAndOptions: options");
                    t.assertEquals('string', typeof pathOrOptions , "parsePathAndOptions: pathOrOptions");
                    t.assertEquals(undefined, pathOrOptions.root , "parsePathAndOptions: pathOrOptions.root");
                    t.assertEquals('my/path', pathOrOptions , "parsePathAndOptions: pathOrOptions");
                    t.assertEquals('throwErrors/should/be/boolean/but/ok', options.throwErrors , "parsePathAndOptions: options.throwErrors");
                    t.assertEquals('cacheControl/string/or/function/but/ok', options.cacheControl , "parsePathAndOptions: options.cacheControl");
                    t.assertEquals('contentType/string/object/or/function/but/ok', options.contentType , "parsePathAndOptions: options.contentType");
                    t.assertEquals('etag/should/be/boolean/but/ok', options.etag , "parsePathAndOptions: options.etag");
                                                                                                                        if (verbose) log.info("Correct call.");
                    // Verify to the caller that this mock function was actually called and the above was verified:
                    parsePathAndOptionsWasCalled = true;

                    // Not testing returns, just returning something to prevent false-negative-looking error log.
                    return {
                        path: pathOrOptions,
                        contentTypeFunc: () => options.contentType,
                        cacheControlFunc: () => options.cacheControl
                    };
                },
            }
        },
        verbose);

    const result = lib.get(
        'my/path',
        {
            throwErrors: 'throwErrors/should/be/boolean/but/ok',
            cacheControl: 'cacheControl/string/or/function/but/ok',
            contentType: 'contentType/string/object/or/function/but/ok',
            etag: 'etag/should/be/boolean/but/ok'
        }
    );
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));
    t.assertTrue(parsePathAndOptionsWasCalled, "parsePathAndOptionsWasCalled");
};


exports.testGet_innerbehavior_parsePathAndOptions_error_shouldLogAndAbort = () => {
    //const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_innerbehavior_parsePathAndOptions_error_shouldLogAndAbort:\n");
    let getResourceWasCalled = false;
    let etagReadWasCalled = false;
    doMocks({
            options: {
                errorMessage: "Throw this error on purpose, should be logged but not output"
            },
            io: {
                getResource: () => {
                    getResourceWasCalled = true;
                }
            },
            etag: {
                read: () => {
                    etagReadWasCalled = true;
                }
            }
        },
        verbose);

    const result = lib.get("my/path");
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));
    t.assertFalse(getResourceWasCalled, "getResourceWasCalled");
    t.assertFalse(etagReadWasCalled, "etagReadWasCalled");
    t.assertEquals(500, result.status , "result.status");
    t.assertTrue('string', typeof result.body, "result.body");
    t.assertEquals(-1, result.body.indexOf("on purpose"), "result.body");
    log.info("OK.");
};



exports.testGet_innerbehavior_parsePathAndOptions_outputs_areUsed = () => {
    //const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_innerbehavior_parsePathAndOptions_outputs_areUsed:\n");
    let getResourceWasCalled = false;
    let etagReadWasCalled = false;
    let cacheControlFuncWasCalled = false;
    let contentTypeFuncWasCalled = false;
    doMocks({
            options: {
                path: 'options/path/out',
                etagOverride: 'options/etagOverride/out',
                contentTypeFunc: (path, resource) => {
                    t.assertEquals('/options/path/out', path);
                    t.assertTrue(resource.exists());
                    contentTypeFuncWasCalled = true;
                    return 'options/contentType/out';
                },
                cacheControlFunc: (path, resource, contentType) => {
                    t.assertEquals('/options/path/out', path);
                    t.assertTrue(resource.exists());
                    t.assertEquals('options/contentType/out', contentType);
                    cacheControlFuncWasCalled = true;
                    return 'options/cacheControl/out';
                }
            },
            io: {
                getResource: (path) => {
                    // A slash is added to path in the index.js before getResource, since the pathAndOptionsParser trims and removes it - therefore '/options...'
                    t.assertEquals('/options/path/out', path, "io.getResource.path (cleanPath)");
                    getResourceWasCalled = true;
                    return ioMock.getResource(path, true, `Content for ${path}`);
                }
            },
            etagReader: {
                read: (path, etagOverride) => {
                    t.assertEquals('/options/path/out', path, "etagReader.read.path");
                    t.assertEquals('options/etagOverride/out', etagOverride, "etagReader.read.etagOverride");
                    etagReadWasCalled = true;
                    return "reader/etag/out";
                }
            }
        },
        verbose);

    const result = lib.get('arg/path/in', {
        etag: 'arg/etag/in',
        cacheControl: 'arg/cacheControl/in',
        contentType: 'arg/contentType/in'
    });
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));
    t.assertTrue(getResourceWasCalled, "getResourceWasCalled");
    t.assertTrue(etagReadWasCalled, "etagReadWasCalled");
    t.assertTrue(cacheControlFuncWasCalled, "cacheControlFuncWasCalled");
    t.assertTrue(contentTypeFuncWasCalled, "contentTypeFuncWasCalled");

    t.assertEquals('options/cacheControl/out', result.headers['Cache-Control'], 'cacheControl');
    t.assertEquals('reader/etag/out', result.headers.ETag, 'cacheControl');
    t.assertEquals('options/contentType/out', result.contentType, 'contentType');

                                                                                                                        if (verbose) t.assertTrue(false, "OK");
};

/*
exports.testGet_innerbehavior_removesLeadingPathSlashesFromPathBeforeGetPathError = () => {
    const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_innerbehavior_removesLeadingPathSlashesFromPathBeforeGetPathError:\n");

    doMocks({
            options: {
                path: '/my/path',    // With leading slash
            },

        },
        verbose);
    const lib = require('./index');

    let getPathErrorWasCalled = false;
    lib.__getPathError__ = (path) => {
        t.assertEquals('my/path', path);  // getPathError should always be called without leading slash in path
        getPathErrorWasCalled = true;
    }

    lib.get('mocking/replaces/this');

    t.assertTrue(getPathErrorWasCalled, "getPathErrorWasCalled");
}
*/

// Path string argument

exports.testGet_path_string_FullDefaultResponse = () => {
    //const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_path_string_FullDefaultResponse:\n");
    doMocks({}, verbose);

    const result = lib.get('/assets/asset-test-target.txt');
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(200, result.status, "result.status");
    t.assertEquals("Mocked content of '/assets/asset-test-target.txt'", ioMock.readText(result.body), "result.body");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain'");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain'");

    t.assertTrue(!!result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals('object', typeof result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals( "MockedETagPlaceholder", result.headers.ETag, "result.headers should be an object with ETag and Cache-Control");
    t.assertTrue(result.headers.ETag.length > 0, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals(constants.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"], "result.headers should be an object with ETag and Cache-Control");

                                                                                                                        if (verbose) t.assertTrue(false, "OK");
};
exports.testGet_path_option_FullDefaultResponse = () => {
    //const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_path_option_FullDefaultResponse:\n");
    doMocks({}, verbose);

    const result = lib.get({path: '/assets/asset-test-target.txt'});
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(200, result.status, "result.status");
    t.assertEquals("Mocked content of '/assets/asset-test-target.txt'", ioMock.readText(result.body), "result.body");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain'");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain'");

    t.assertTrue(!!result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals('object', typeof result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals( "MockedETagPlaceholder", result.headers.ETag, "result.headers should be an object with ETag and Cache-Control");
    t.assertTrue(result.headers.ETag.length > 0, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals(constants.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"], "result.headers should be an object with ETag and Cache-Control");
                                                                                                                        if (verbose) t.assertTrue(false, "OK");
};

exports.testGet_DEV_path_string_FullDefaultResponse_DEV = () => {
    //const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_DEV_path_string_FullDefaultResponse_DEV:\n");
    doMocks({isDev: true}, verbose);

    const result = lib.get('/assets/asset-test-target.txt');
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(200, result.status, "result.status");
    t.assertEquals("Mocked content of '/assets/asset-test-target.txt'", ioMock.readText(result.body), "result.body");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain'");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain'");

    t.assertTrue(!!result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals('object', typeof result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals( "MockedETagPlaceholder", result.headers.ETag, "result.headers should be an object with ETag and Cache-Control");
    t.assertTrue(result.headers.ETag.length > 0, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals(constants.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"], "result.headers should be an object with ETag and Cache-Control");

                                                                                                                        if (verbose) t.assertTrue(false, "OK");
};
exports.testGet_DEV_path_option_FullDefaultResponse = () => {
    //const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_DEV_path_option_FullDefaultResponse:\n");
    doMocks({isDev: true}, verbose);

    const result = lib.get({path: '/assets/asset-test-target.txt'});
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(200, result.status, "result.status");
    t.assertEquals("Mocked content of '/assets/asset-test-target.txt'", ioMock.readText(result.body), "result.body");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain'");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain'");

    t.assertTrue(!!result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals('object', typeof result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals( "MockedETagPlaceholder", result.headers.ETag, "result.headers should be an object with ETag and Cache-Control");
    t.assertTrue(result.headers.ETag.length > 0, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals(constants.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"], "result.headers should be an object with ETag and Cache-Control");

                                                                                                                        if (verbose) t.assertTrue(false, "OK");
};

exports.testGet_contentType_HTML = () => {
    //const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_contentType_HTML:\n");
    doMocks({
            io: {
                mimeType: "text/html"
            }
        },
        verbose);

    const result = lib.get('/assets/asset-test-target.html');
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(200, result.status, "result.status");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/html'");
    t.assertTrue(result.contentType.indexOf("text/html") !== -1, "Expected string contentType containing 'text/html'");
                                                                                                                        if (verbose) t.assertTrue(false, "OK");
}


// .get problem/error handling:

exports.testGet_path_noExist_shouldOnly404 = () => {
    //const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_path_noExist_shouldOnly404:\n");
    doMocks({
            io: {
                exists: false
            }
        },
        verbose);

    const result = lib.get('/assets/asset-test-target.txt');

                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(404, result.status, "result.status");

    t.assertEquals(undefined, result.body, "result.body");
    t.assertEquals(undefined, result.contentType, "result.contentType");
    t.assertEquals(undefined, result.headers, "result.headers");
                                                                                                                        if (verbose) t.assertTrue(false, "OK");
};

exports.testGet_DEV_path_noExist_should404withInfo = () => {
    //const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_DEV_path_noExist_should404withInfo:\n");
    doMocks({
            isDev: true,
            io: {
                exists: false
            }
        },
        verbose);

    const result = lib.get('/assets/asset-test-target.txt');
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(404, result.status, "result.status");
    t.assertEquals('string', typeof result.body, "Expected string body containing path in dev");
    t.assertTrue(result.body.indexOf('/assets/asset-test-target.txt') !== -1, "Expected string body containing path in dev");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain' in dev");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain' in dev");

    t.assertEquals(undefined, result.headers, "result.headers");

                                                                                                                        if (verbose) t.assertTrue(false, "OK");
};

exports.testGet_path_empty_shouldOnly400 = () => {
    //const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_path_empty_shouldOnly400:\n");
    doMocks({
            options: {
                path: ''
            }
        },
        verbose);

    const result = lib.get();
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(400, result.status, "result.status");

    t.assertEquals(undefined, result.body, "result.body");
    t.assertEquals(undefined, result.contentType, "result.contentType");
    t.assertEquals(undefined, result.headers, "result.headers");

                                                                                                                        if (verbose) t.assertTrue(false, "OK");
}


exports.testGet_DEV_path_empty_should400WithInfo = () => {
    //const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_DEV_path_empty_should400WithInfo:\n");
    doMocks({
            isDev: true,
            options: {
                path: ''
            }
        },
        verbose);

    const result = lib.get();
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(400, result.status, "result.status");

    t.assertEquals('string', typeof result.body, "Expected string body with error message in dev");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain' in dev");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain' in dev");

    t.assertEquals(undefined, result.headers, "result.headers");
                                                                                                                        if (verbose) t.assertTrue(false, "OK");
}
// No need to test for path:spaces too - pathAndOptionsParser is trusted to trim the path.


exports.testGet_path_slash_shouldOnly400 = () => {
    //const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_path_slash_shouldOnly400:\n");
    doMocks({
        },
        verbose);

    const result = lib.get('/');
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(400, result.status, "result.status");

    t.assertEquals(undefined, result.body, "result.body");
    t.assertEquals(undefined, result.contentType, "result.contentType");
    t.assertEquals(undefined, result.headers, "result.headers");
                                                                                                                        if (verbose) t.assertTrue(false, "OK");
}

exports.testGet_path_slashes_shouldOnly400 = () => {
    //const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_path_slashes_shouldOnly400:\n");
    doMocks({
        },
        verbose);

    const result = lib.get('///');
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(400, result.status, "result.status");

    t.assertEquals(undefined, result.body, "result.body");
    t.assertEquals(undefined, result.contentType, "result.contentType");
    t.assertEquals(undefined, result.headers, "result.headers");
                                                                                                                        if (verbose) t.assertTrue(false, "OK");
}


exports.testGet_DEV_path_slash_should400WithInfo = () => {
    const verbpse = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_DEV_path_slash_should400WithInfo:\n");
    doMocks({
            isDev: true
        },
        verbose);

    const result = lib.get('/');
    if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(400, result.status, "result.status");

    t.assertEquals('string', typeof result.body, "Expected string body with error message in dev");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain' in dev");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain' in dev");

    t.assertEquals(undefined, result.headers, "result.headers");
                                                                                                                        if (verbose) t.assertTrue(false, "OK");
}

exports.testGet_DEV_path_slashes_should400WithInfo = () => {
    //const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_DEV_path_slashes_should400WithInfo:\n");
    doMocks({
            isDev: true
        },
        verbose);

    const result = lib.get('///');
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(400, result.status, "result.status");

    t.assertEquals('string', typeof result.body, "Expected string body with error message in dev");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain' in dev");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain' in dev");

    t.assertEquals(undefined, result.headers, "result.headers");
                                                                                                                        if (verbose) t.assertTrue(false, "OK");
}


// Optionparser always collects its own errors and returns an errormessage. Log, and output error ID in body
exports.testGet_optionParsingError_should500withErrorId = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_optionParsingError_should500withErrorId:\n");
    doMocks({
            options: {
                parsePathAndOptions: () => ({
                    errorMessage: "This was thrown on purpose when parsing path and options."
                })
            }
        },
        verbose);

    const result = lib.get("my/path");
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(500, result.status, "result.status");

    t.assertEquals("string", typeof result.body, "result.body error message");
    t.assertTrue(result.body.indexOf !== "Server error", "result.body error message");
    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain' in dev");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain' in dev");
    t.assertEquals(undefined, result.headers, "result.headers");
    log.info("OK.");
}

// contentTypeFunc is run outside pathAndOptions parser, but errors here should still be caught
exports.testGet_contentTypeFuncError_should500withErrorId = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_contentTypeFuncError_should500withErrorId:\n");
    doMocks({
            options: {
                contentTypeFunc: () => {
                    throw Error("This was thrown on purpose when running contentTypeFunc.");
                }
            }
        },
        verbose);

    const result = lib.get("my/path");
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(500, result.status, "result.status");

    t.assertEquals("string", typeof result.body, "result.body error message");
    t.assertTrue(result.body.indexOf !== "Server error", "result.body error message");
    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain' in dev");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain' in dev");
    t.assertEquals(undefined, result.headers, "result.headers");
    log.info("OK.");
}

// cacheControlFunc is run outside pathAndOptions parser, but errors here should still be caught
exports.testGet_cacheControlFuncError_should500withErrorId = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_cacheControlFuncError_should500withErrorId:\n");
    doMocks({
            options: {
                cacheControlFunc: () => {
                    throw Error("This was thrown on purpose when running cacheControlFunc.");
                }
            }
        },
        verbose);

    const result = lib.get("my/path");
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));

    t.assertEquals(500, result.status, "result.status");

    t.assertEquals("string", typeof result.body, "result.body error message");
    t.assertTrue(result.body.indexOf !== "Server error", "result.body error message");
    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain' in dev");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain' in dev");
    t.assertEquals(undefined, result.headers, "result.headers");
    log.info("OK.");
}

// TODO: think of and test more possible parsePathAndOptions outputs, and consequent handling and behavior?


// Optionparser always collects its own errors and returns an errormessage. Log, and output error ID in body
exports.testGet_optionParsing_throwErrors_shouldThrowError = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_optionParsing_throwErrors_shouldThrowError:\n");
    doMocks({
            options: {
                parsePathAndOptions: () => ({
                    errorMessage: "This was thrown on purpose when parsing path and options.",
                    throwErrors: true
                })
            }
        },
        verbose);

    let failed = true, result = undefined;
    try {
        result = lib.get("my/path");
        failed = false;
    } catch (e) {
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));
                                                                                                                        if (verbose) log.error(e);
    }

    t.assertTrue(failed, "failed");
    t.assertEquals(undefined, result, "result");
                                                                                                                        if (verbose) log.info("OK.");
}

// contentTypeFunc is run outside pathAndOptions parser, but errors here should still be caught
exports.testGet_contentTypeFunc_throwErrors_shouldThrowError = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_contentTypeFunc_throwErrors_shouldThrowError:\n");
    doMocks({
            options: {
                contentTypeFunc: () => {
                    throw Error("This was thrown on purpose when running contentTypeFunc.");
                },
                throwErrors: true
            }
        },
        verbose);

    let failed = true, result = undefined;
    try {
        result = lib.get("my/path");
        failed = false;
    } catch (e) {
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));
                                                                                                                        if (verbose) log.error(e);
    }

    t.assertTrue(failed, "failed");
    t.assertEquals(undefined, result, "result");
                                                                                                                        if (verbose) log.info("OK.");
}

// cacheControlFunc is run outside pathAndOptions parser, but errors here should still be caught
exports.testGet_cacheControlFunc_throwErrors_shouldThrowError = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_cacheControlFunc_throwErrors_shouldThrowError:\n");
    doMocks({
            options: {
                cacheControlFunc: () => {
                    throw Error("This was thrown on purpose when running cacheControlFunc.");
                },
                throwErrors: true
            }
        },
        verbose);

    let failed = true, result = undefined;
    try {
        result = lib.get("my/path");
        failed = false;
    } catch (e) {
                                                                                                                        if (verbose) log.info("result: " + JSON.stringify(result, null, 2));
                                                                                                                        if (verbose) log.error(e);
    }

    t.assertTrue(failed, "failed");
    t.assertEquals(undefined, result, "result");
    log.info("OK.");
}
