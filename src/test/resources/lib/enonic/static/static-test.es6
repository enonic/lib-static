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
        contentTypeFunc: function [(filePathAndName, resource, mimeType) => string]
        cacheControlFunc: function [(filePathAndName, resource) => string]
        cacheControl: string or boolean
        contentType: string or boolean
        etag: string
        throwErrors: boolean
        getCleanPath
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

//////////////////////////////////////////////////////////////////  TEST .get

exports.testGet_innerbehavior_mockedCall_parsePathAndOptions_1arg = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_innerbehavior_mockedCall_parsePathAndOptions_1arg:\n");
    let parsePathAndOptionsWasCalled = false;
    doMocks({
            options: {
                parsePathAndOptions: (pathOrOptions, options) => {
                                                                                                                        if (verbose) log.info(prettify(pathOrOptions, "parsePathAndOptions call - pathOrOptions"));
                                                                                                                        if (verbose) log.info(prettify(options, "parsePathAndOptions call - options"));
                    // Verify that the arguments of .get are passed into parsePathAndOptions the expected way:
                    t.assertEquals(undefined, options, "parsePathAndOptions: options");
                    t.assertEquals('object', typeof pathOrOptions , "parsePathAndOptions: pathOrOptions");
                    t.assertEquals(undefined, pathOrOptions.root , "parsePathAndOptions: pathOrOptions.root");
                    t.assertEquals('my/path', pathOrOptions.path , "parsePathAndOptions: pathOrOptions.path");
                    t.assertEquals('throwErrors/should/be/boolean/but/ok', pathOrOptions.throwErrors , "parsePathAndOptions: pathOrOptions.throwErrors");
                    t.assertEquals('cacheControl/string/or/function/but/ok', pathOrOptions.cacheControl , "parsePathAndOptions: pathOrOptions.cacheControl");
                    t.assertEquals('contentType/string/object/or/function/but/ok', pathOrOptions.contentType , "parsePathAndOptions: pathOrOptions.contentType");
                    t.assertEquals('etag/should/be/boolean/but/ok', pathOrOptions.etag , "parsePathAndOptions: pathOrOptions.etag");
                    t.assertEquals('getCleanPath/should/be/function/but/ok', pathOrOptions.getCleanPath , "parsePathAndOptions: pathOrOptions.getCleanPath");
                                                                                                                        if (verbose) log.info("Correct call.");
                    // Verify to the caller that this mock function was actually called and the above was verified:
                    parsePathAndOptionsWasCalled = true;

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
        etag: 'etag/should/be/boolean/but/ok',
        getCleanPath: 'getCleanPath/should/be/function/but/ok'
    });
                                                                                                                        if (verbose) log.info(prettify(result, "result"));
    t.assertTrue(parsePathAndOptionsWasCalled, "parsePathAndOptionsWasCalled");
    log.info("OK.");
};

exports.testGet_innerbehavior_mockedCall_parsePathAndOptions_2arg = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_innerbehavior_mockedCall_parsePathAndOptions_2arg:\n");
    let parsePathAndOptionsWasCalled = false;
    doMocks({
            options: {
                parsePathAndOptions: (pathOrOptions, options) => {
                                                                                                                        if (verbose) log.info(prettify(pathOrOptions, "parsePathAndOptions call - pathOrOptions"));
                                                                                                                        if (verbose) log.info(prettify(options, "parsePathAndOptions call - options"));
                    // Verify that the arguments of .get are passed into parsePathAndOptions the expected way:
                    t.assertEquals('object', typeof options, "parsePathAndOptions: options");
                    t.assertEquals('string', typeof pathOrOptions , "parsePathAndOptions: pathOrOptions");
                    t.assertEquals(undefined, pathOrOptions.root , "parsePathAndOptions: pathOrOptions.root");
                    t.assertEquals('my/path', pathOrOptions , "parsePathAndOptions: pathOrOptions");
                    t.assertEquals('throwErrors/should/be/boolean/but/ok', options.throwErrors , "parsePathAndOptions: options.throwErrors");
                    t.assertEquals('cacheControl/string/or/function/but/ok', options.cacheControl , "parsePathAndOptions: options.cacheControl");
                    t.assertEquals('contentType/string/object/or/function/but/ok', options.contentType , "parsePathAndOptions: options.contentType");
                    t.assertEquals('etag/should/be/boolean/but/ok', options.etag , "parsePathAndOptions: options.etag");
                    t.assertEquals('getCleanPath/should/be/function/but/ok', options.getCleanPath , "parsePathAndOptions: options.getCleanPath");
                                                                                                                        if (verbose) log.info("Correct call.");
                    // Verify to the caller that this mock function was actually called and the above was verified:
                    parsePathAndOptionsWasCalled = true;

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
            etag: 'etag/should/be/boolean/but/ok',
            getCleanPath: 'getCleanPath/should/be/function/but/ok'
        }
    );
                                                                                                                        if (verbose) log.info(prettify(result, "result"));
    t.assertTrue(parsePathAndOptionsWasCalled, "parsePathAndOptionsWasCalled");
    log.info("OK.");
};


exports.testGet_innerbehavior_parsePathAndOptions_errorShouldLogAndAbort = () => {
    //const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_innerbehavior_parsePathAndOptions_errorShouldLogAndAbort:\n");
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
                                                                                                                        if (verbose) log.info(prettify(result, "result"));
    t.assertFalse(getResourceWasCalled, "getResourceWasCalled");
    t.assertFalse(etagReadWasCalled, "etagReadWasCalled");
    t.assertEquals(500, result.status , "result.status");
    t.assertTrue('string', typeof result.body, "result.body");
    t.assertEquals(-1, result.body.indexOf("on purpose"), "result.body");
    log.info("OK.");
};



exports.testGet_innerbehavior_parsePathAndOptions_shouldUseOutputsNotDirectArgs = () => {
    //const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_innerbehavior_parsePathAndOptions_shouldUseOutputsNotDirectArgs:\n");
    let getResourceWasCalled = false;
    let etagReadWasCalled = false;
    doMocks({
            options: {
                path: 'options/path/out',
                etagOverride: 'options/etagOverride/out',
                cacheControlFunc: () => 'options/cacheControl/out',
                contentTypeFunc: () => 'options/contentType/out'
            },
            io: {
                getResource: (path) => {
                    // A slash is added to path in the index.js before getResource, since the pathAndOptionsParser trims and removes it - therefore '/options...'
                    t.assertEquals('/options/path/out', path, "io.getResource.path");
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
                                                                                                                        if (verbose) log.info(prettify(result, "result"));
    t.assertTrue(getResourceWasCalled, "getResourceWasCalled");
    t.assertTrue(etagReadWasCalled, "etagReadWasCalled");
    t.assertEquals(200, result.status , "result.status");
    t.assertTrue('string', typeof result.body, "result.body");
    t.assertEquals('options/cacheControl/out', result.headers['Cache-Control'], 'cacheControl');
    t.assertEquals('reader/etag/out', result.headers.ETag, 'cacheControl');
    t.assertEquals('options/contentType/out', result.contentType, 'contentType');
    log.info("OK.");
};


// Path string argument

exports.testGet_path_string_FullDefaultResponse = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_path_string_FullDefaultResponse:\n");
    doMocks({
            etagReader: {
                etag: "expectedEtag1234567890"
            }
        },
        verbose);

    const result = lib.get('/assets/asset-test-target.txt');
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(200, result.status, "result.status");
    t.assertEquals("Mocked content of '/assets/asset-test-target.txt'", ioMock.readText(result.body), "result.body");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain'");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain'");

    t.assertTrue(!!result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals('object', typeof result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals( "expectedEtag1234567890", result.headers.ETag, "result.headers should be an object with ETag and Cache-Control");
    t.assertTrue(result.headers.ETag.length > 0, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals(DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"], "result.headers should be an object with ETag and Cache-Control");
};
exports.testGet_path_option_FullDefaultResponse = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_path_option_FullDefaultResponse:\n");
    doMocks({
            etagReader: {
                etag: "expectedEtag1234567890"
            }
        },
        verbose);

    const result = lib.get({path: '/assets/asset-test-target.txt'});
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(200, result.status, "result.status");
    t.assertEquals("Mocked content of '/assets/asset-test-target.txt'", ioMock.readText(result.body), "result.body");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain'");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain'");

    t.assertTrue(!!result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals('object', typeof result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals( "expectedEtag1234567890", result.headers.ETag, "result.headers should be an object with ETag and Cache-Control");
    t.assertTrue(result.headers.ETag.length > 0, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals(DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"], "result.headers should be an object with ETag and Cache-Control");
};

exports.testGet_DEV_path_string_FullDefaultResponse_DEV = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_DEV_path_string_FullDefaultResponse_DEV:\n");
    doMocks({
            isDev: true,
            etagReader: {
                etag: "expectedEtag1234567890"
            }
        },
        verbose);

    const result = lib.get('/assets/asset-test-target.txt');
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(200, result.status, "result.status");
    t.assertEquals("Mocked content of '/assets/asset-test-target.txt'", ioMock.readText(result.body), "result.body");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain'");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain'");

    t.assertTrue(!!result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals('object', typeof result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals( "expectedEtag1234567890", result.headers.ETag, "result.headers should be an object with ETag and Cache-Control");
    t.assertTrue(result.headers.ETag.length > 0, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals(DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"], "result.headers should be an object with ETag and Cache-Control");
};
exports.testGet_DEV_path_option_FullDefaultResponse = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_DEV_path_option_FullDefaultResponse:\n");
    doMocks({
            isDev: true,
            etagReader: {
                etag: "expectedEtag1234567890"
            }
        },
        verbose);

    const result = lib.get({path: '/assets/asset-test-target.txt'});
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(200, result.status, "result.status");
    t.assertEquals("Mocked content of '/assets/asset-test-target.txt'", ioMock.readText(result.body), "result.body");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain'");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain'");

    t.assertTrue(!!result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals('object', typeof result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals( "expectedEtag1234567890", result.headers.ETag, "result.headers should be an object with ETag and Cache-Control");
    t.assertTrue(result.headers.ETag.length > 0, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals(DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"], "result.headers should be an object with ETag and Cache-Control");
};

exports.testGet_contentType_HTML = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_path_HTML_FullDefaultResponse:\n");
    doMocks({
            io: {
                mimeType: "text/html"
            }
        },
        verbose);

    const result = lib.get('/assets/asset-test-target.html');
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(200, result.status, "result.status");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/html'");
    t.assertTrue(result.contentType.indexOf("text/html") !== -1, "Expected string contentType containing 'text/html'");
}


// .get problem/error handling:

exports.testGet_path_noExist_shouldOnly404 = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_path_noExist_shouldOnly404:\n");
    doMocks({
            io: {
                exists: false
            }
        },
        verbose);

    const result = lib.get('/assets/asset-test-target.txt');

                                                                                                                        if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(404, result.status, "result.status");

    t.assertEquals(undefined, result.body, "result.body");
    t.assertEquals(undefined, result.contentType, "result.contentType");
    t.assertEquals(undefined, result.headers, "result.headers");
    log.info("OK.");
};

exports.testGet_DEV_path_noExist_should404withInfo = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_DEV_path_noExist_should404withInfo:\n");
    doMocks({
            isDev: true,
            io: {
                exists: false
            }
        },
        verbose);

    const result = lib.get('/assets/asset-test-target.txt');
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(404, result.status, "result.status");
    t.assertEquals('string', typeof result.body, "Expected string body containing path in dev");
    t.assertTrue(result.body.indexOf('/assets/asset-test-target.txt') !== -1, "Expected string body containing path in dev");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain' in dev");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain' in dev");

    t.assertEquals(undefined, result.headers, "result.headers");
    log.info("OK.");
};

exports.testGet_path_empty_shouldOnly400 = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_path_empty_shouldOnly400:\n");
    doMocks({
        },
        verbose);

    const result = lib.get('');
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(400, result.status, "result.status");

    t.assertEquals(undefined, result.body, "result.body");
    t.assertEquals(undefined, result.contentType, "result.contentType");
    t.assertEquals(undefined, result.headers, "result.headers");
    log.info("OK.");
}


exports.testGet_DEV_path_empty_should400WithInfo = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_DEV_path_empty_should400WithInfo:\n");
    doMocks({
            isDev: true,
        },
        verbose);

    const result = lib.get('');
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(400, result.status, "result.status");

    t.assertEquals('string', typeof result.body, "Expected string body with error message in dev");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain' in dev");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain' in dev");

    t.assertEquals(undefined, result.headers, "result.headers");
    log.info("OK.");
}

/* Skip these - path is verified and trimmed by parsePathAndOptions */
exports.testGet_path_spaces_shouldOnly400 = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_path_spaces_shouldOnly400:\n");
    doMocks({
            options: {
                path: '' // Trust the options parser to trim the path
            }
        },
        verbose);

    const result = lib.get('   ');
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(400, result.status, "result.status");

    t.assertEquals(undefined, result.body, "result.body");
    t.assertEquals(undefined, result.contentType, "result.contentType");
    t.assertEquals(undefined, result.headers, "result.headers");
    log.info("OK.");
}


exports.testGet_DEV_path_spaces_should400WithInfo = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_DEV_path_spaces_should400WithInfo:\n");
    doMocks({
            isDev: true,
            options: {
                    path: '' // Trust the options parser to trim the path
            }
        },
        verbose);

    const result = lib.get('   ');
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(400, result.status, "result.status");

    t.assertEquals('string', typeof result.body, "Expected string body with error message in dev");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain' in dev");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain' in dev");

    t.assertEquals(undefined, result.headers, "result.headers");
    log.info("OK.");
}



exports.testGet_path_slash_shouldOnly400 = () => {
    if (verbose) log.info("\n\n\ntestGet_path_slash_shouldOnly400:\n");
    doMocks({
        },
        verbose);

    const result = lib.get('/');
    if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(400, result.status, "result.status");

    t.assertEquals(undefined, result.body, "result.body");
    t.assertEquals(undefined, result.contentType, "result.contentType");
    t.assertEquals(undefined, result.headers, "result.headers");
    log.info("OK.");
}

exports.testGet_path_slashes_shouldOnly400 = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_path_slashes_shouldOnly400:\n");
    doMocks({
        },
        verbose);

    const result = lib.get('///');
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(400, result.status, "result.status");

    t.assertEquals(undefined, result.body, "result.body");
    t.assertEquals(undefined, result.contentType, "result.contentType");
    t.assertEquals(undefined, result.headers, "result.headers");
    log.info("OK.");
}


exports.testGet_DEV_path_slash_should400WithInfo = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_DEV_path_slash_should400WithInfo:\n");
    doMocks({
            isDev: true
        },
        verbose);

    const result = lib.get('/');
    if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(400, result.status, "result.status");

    t.assertEquals('string', typeof result.body, "Expected string body with error message in dev");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain' in dev");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain' in dev");

    t.assertEquals(undefined, result.headers, "result.headers");
    log.info("OK.");
}

exports.testGet_DEV_path_slashes_should400WithInfo = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_DEV_path_slash_should400WithInfo:\n");
    doMocks({
            isDev: true
        },
        verbose);

    const result = lib.get('///');
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(400, result.status, "result.status");

    t.assertEquals('string', typeof result.body, "Expected string body with error message in dev");

    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain' in dev");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain' in dev");

    t.assertEquals(undefined, result.headers, "result.headers");
    log.info("OK.");
}

exports.testGet_path_missing_should500withErrorId = () => {
    const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_path_missing_shouldOnly500:\n");
    doMocks({
        },
        verbose);

    const result = lib.get();
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(500, result.status, "result.status");

    t.assertEquals("string", typeof result.body, "result.body error message");
    t.assertTrue(result.body.indexOf !== "Server error", "result.body error message");
    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain' in dev");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain' in dev");
    t.assertEquals(undefined, result.headers, "result.headers");
    log.info("OK.");
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
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

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
    const verbose = true;
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
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

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
    const verbose = true;
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
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(500, result.status, "result.status");

    t.assertEquals("string", typeof result.body, "result.body error message");
    t.assertTrue(result.body.indexOf !== "Server error", "result.body error message");
    t.assertEquals('string', typeof result.contentType, "Expected string contentType containing 'text/plain' in dev");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain' in dev");
    t.assertEquals(undefined, result.headers, "result.headers");
    log.info("OK.");
}



/*

exports.testGet_fail_optionParsingError_throwErrors = () => {
    const lib = require('./index');

    let result = null,
        failed = true;
    try {
        result = lib.get('/assets/asset-test-target.txt', {
            etag: 0,
            throwErrors: true
        });
        failed = false;
    } catch (e) {
        log.info("OK: " + e.message);
    }

    t.assertTrue(failed, "Should have failed. Instead, got a result: " + JSON.stringify(result));
}

exports.testGet_fail_contentTypeFunc_runtimeError_throwErrors = () => {
    const lib = require('./index');

    let result = null,
        failed = true;
    try {
        result = lib.get('/assets/asset-test-target.txt', {
            contentType: () => {
                throw Error("This will be thrown outside of parsePathAndFunctions. Should still be handled.");
            },
            throwErrors: true
        });

        failed = false;

    } catch (e) {
        log.info("OK: " + e.message);
    }

    t.assertTrue(failed, "Should have failed. Instead, got a result: " + JSON.stringify(result));
}

exports.testGet_fail_cacheControlFunc_runtimeError_throwErrors = () => {
    const lib = require('./index');

    let result = null,
        failed = true;
    try {
        result = lib.get('/assets/asset-test-target.txt', {
            cacheControl: () => {
                throw Error("This will be thrown outside of parsePathAndFunctions. Should still be handled.");
            },
            throwErrors: true
        });

        failed = false;

    } catch (e) {
        log.info("OK: " + e.message);
    }

    t.assertTrue(failed, "Should have failed. Instead, got a result: " + JSON.stringify(result));
}

/* export index.es6.resolvePath to test:
exports.testResolvePath = () => {
    t.assertEquals("", lib.resolvePath("/"));
    t.assertEquals("..", lib.resolvePath("/.."));
    t.assertEquals("..", lib.resolvePath("../"));
    t.assertEquals("", lib.resolvePath("////////"));
    t.assertEquals("", lib.resolvePath("begone/.."));
    t.assertEquals("will/be/lost/in/time", lib.resolvePath("all/../those/../moments/../will/be/lost/in/time"));
    t.assertEquals("will/be/lost/in/time", lib.resolvePath("will/be/lost/in/time/like/../tears/../in/../rain/.."));
    t.assertEquals("will/be/lost/in/time", lib.resolvePath("all/those/moments/../../../will/be/lost/in/time"));
    t.assertEquals("will/be/lost/in/time", lib.resolvePath("will/be/lost/in/time/like/../tears/in/rain/../../.."));
    t.assertEquals("will/be/lost/in/time", lib.resolvePath("will/be/lost/in/time/like/../tears/in/rain/../../../"));
    t.assertEquals("../will/be/lost/in/time", lib.resolvePath("../all/../those/../moments/../will/be/lost/in/time"));
    t.assertEquals("../will/be/lost/in/time", lib.resolvePath("../will/be/lost/in/time/like/../tears/../in/../rain/.."));
    t.assertEquals("will/be/lost/in/time", lib.resolvePath("will/be/lost/../in/time/"))
}
 */






exports.testGet_innerbehaviour_getPathError_stringArg_isCalled = () => {
    const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_innerbehaviour_getPathError_stringArg_isCalled:\n");
    doMocks({
        },
        verbose);
    const lib = require('./index');

    let target = undefined;

    // Mock an inner function to verify it's called with the path param
    lib.__getPathError__ = (path) => {
        target = path;
    }

    const result = lib.get("my/unique/testing/path");

    t.assertEquals(target, "my/unique/testing/path");
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

}


exports.testGet_innerbehaviour_getPathError_optionArg_isCalled = () => {
    const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_innerbehaviour_getPathError_optionArg_isCalled:\n");
    doMocks({
        },
        verbose);
    const lib = require('./index');

    let target = undefined;

    // Mock an inner function to verify it's called with the path param
    lib.__getPathError__ = (path) => {
        target = path;
    }

    const result = lib.get({path: "another/unique/testing/path"});

    t.assertEquals(target, "another/unique/testing/path");
    if (verbose) log.info(prettify(result, "result"));

}


exports.testGet_innerbehaviour_getPathError_isUsed = () => {
    const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_innerbehaviour_getPathError_isUsed:\n");
    const lib = require('./index');
    t.assertTrue(false, "Not implemented")

}

/*
exports.testGetPathError_valid_shouldReturnUndefined = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetPathError_valid_shouldReturnUndefined:\n");
    const lib = require('./index');

    t.assertEquals(undefined, lib.__getPathError__('hey'));
    t.assertEquals(undefined, lib.__getPathError__('æøå'));
    t.assertEquals(undefined, lib.__getPathError__('foo/bar'));
    t.assertEquals(undefined, lib.__getPathError__('/slash/start'));
    t.assertEquals(undefined, lib.__getPathError__('slash/end/'));
}

exports.testGetPathError_empty_shouldReturnNonEmptyErrorMessage = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetPathError_empty_shouldReturnNonEmptyErrorMessage:\n");
    const lib = require('./index');

    const errorMessage = lib.__getPathError__('');
    t.assertEquals('string', typeof errorMessage);
    t.assertNotEquals('', errorMessage.trim());
                                                                                                                        if (verbose) log.info("OK: " + errorMessage);
}
*/

/* Probably no point in testing
exports.testGetPathError_allSpaces_shouldPassSinceStringShouldBeTrimmedFirst = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetPathError_allSpaces_shouldPassSinceStringShouldBeTrimmedFirst:\n");
    const lib = require('./index');

    const errorMessage = lib.__getPathError__('   ');
    t.assertEquals(undefined, errorMessage);
                                                                                                                        if (verbose) log.info("OK: " + errorMessage);
}
*/
/*
exports.testGetPathError_doubleDot_shouldReturnNonEmptyErrorMessage = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetPathError_doubleDot_shouldReturnNonEmptyErrorMessage:\n");
    const lib = require('./index');

    const errorMessage = lib.__getPathError__('foo/../bar');
    t.assertEquals('string', typeof errorMessage);
    t.assertNotEquals('', errorMessage.trim());

    t.assertNotEquals('', lib.__getPathError__('../foo/bar').trim());
    t.assertNotEquals('', lib.__getPathError__('foo/bar/..').trim());
                                                                                                                        if (verbose) log.info("OK: " + errorMessage);
}

exports.testGetPathError_asterisk_shouldReturnNonEmptyErrorMessage = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetPathError_asterisk_shouldReturnNonEmptyErrorMessage:\n");
    const lib = require('./index');

    const errorMessage = lib.__getPathError__('foo/*bar');
    t.assertEquals('string', typeof errorMessage);
    t.assertNotEquals('', errorMessage.trim());

    t.assertNotEquals('', lib.__getPathError__('f*oo/bar').trim());
    t.assertNotEquals('', lib.__getPathError__('foo/*.bar').trim());
                                                                                                                        if (verbose) log.info("OK: " + errorMessage);
}

exports.testGetPathError_questionmark_shouldReturnNonEmptyErrorMessage = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetPathError_questionmark_shouldReturnNonEmptyErrorMessage:\n");
    const lib = require('./index');

    const errorMessage = lib.__getPathError__('foo/?bar');
    t.assertEquals('string', typeof errorMessage);
    t.assertNotEquals('', errorMessage.trim());

    t.assertNotEquals('', lib.__getPathError__('?/foo/bar').trim());
    t.assertNotEquals('', lib.__getPathError__('foo/?.bar').trim());
                                                                                                                        if (verbose) log.info("OK: " + errorMessage);
}

exports.testGetPathError_backslash_shouldReturnNonEmptyErrorMessage = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetPathError_backslash_shouldReturnNonEmptyErrorMessage:\n");
    const lib = require('./index');

    const errorMessage = lib.__getPathError__('foo/\\bar');
    t.assertEquals('string', typeof errorMessage);
    t.assertNotEquals('', errorMessage.trim());

    t.assertNotEquals('', lib.__getPathError__('\\/foo/bar').trim());
    t.assertNotEquals('', lib.__getPathError__('foo\\bar').trim());
                                                                                                                        if (verbose) log.info("OK: " + errorMessage);
}

exports.testGetPathError_quote_shouldReturnNonEmptyErrorMessage = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetPathError_quote_shouldReturnNonEmptyErrorMessage:\n");
    const lib = require('./index');

    const errorMessage = lib.__getPathError__("foo/'bar");
    t.assertEquals('string', typeof errorMessage);
    t.assertNotEquals('', errorMessage.trim());

    t.assertNotEquals('', lib.__getPathError__("'foobar").trim());
    t.assertNotEquals('', lib.__getPathError__("foobar'").trim());
    t.assertNotEquals('', lib.__getPathError__("'foobar'").trim());
                                                                                                                        if (verbose) log.info("OK: " + errorMessage);
}

exports.testGetPathError_doublequote_shouldReturnNonEmptyErrorMessage = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetPathError_doublequote_shouldReturnNonEmptyErrorMessage:\n");
    const lib = require('./index');

    const errorMessage = lib.__getPathError__('foo/"bar');
    t.assertEquals('string', typeof errorMessage);
    t.assertNotEquals('', errorMessage.trim());

    t.assertNotEquals('', lib.__getPathError__('"foobar').trim());
    t.assertNotEquals('', lib.__getPathError__('foobar"').trim());
    t.assertNotEquals('', lib.__getPathError__('"foobar"').trim());
                                                                                                                        if (verbose) log.info("OK: " + errorMessage);
}

exports.testGetPathError_tick_shouldReturnNonEmptyErrorMessage = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetPathError_tick_shouldReturnNonEmptyErrorMessage:\n");
    const lib = require('./index');

    const errorMessage = lib.__getPathError__('foo´bar');
    t.assertEquals('string', typeof errorMessage);
    t.assertNotEquals('', errorMessage.trim());

    t.assertNotEquals('', lib.__getPathError__('´foobar').trim());
    t.assertNotEquals('', lib.__getPathError__('foobar´').trim());
    t.assertNotEquals('', lib.__getPathError__('´foobar´').trim());
                                                                                                                        if (verbose) log.info("OK: " + errorMessage);
}

exports.testGetPathError_backtick_shouldReturnNonEmptyErrorMessage = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetPathError_backtick_shouldReturnNonEmptyErrorMessage:\n");
    const lib = require('./index');

    const errorMessage = lib.__getPathError__('foo`bar');
    t.assertEquals('string', typeof errorMessage);
    t.assertNotEquals('', errorMessage.trim());

    t.assertNotEquals('', lib.__getPathError__('`foobar').trim());
    t.assertNotEquals('', lib.__getPathError__('foobar`').trim());
    t.assertNotEquals('', lib.__getPathError__('`foobar`').trim());
                                                                                                                        if (verbose) log.info("OK: " + errorMessage);
}

exports.testGetPathError_lesserthan_shouldReturnNonEmptyErrorMessage = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetPathError_lesserthan_shouldReturnNonEmptyErrorMessage:\n");
    const lib = require('./index');

    const errorMessage = lib.__getPathError__('foo<bar');
    t.assertEquals('string', typeof errorMessage);
    t.assertNotEquals('', errorMessage.trim());

    t.assertNotEquals('', lib.__getPathError__('<foobar').trim());
    t.assertNotEquals('', lib.__getPathError__('foobar<').trim());
                                                                                                                        if (verbose) log.info("OK: " + errorMessage);
}

exports.testGetPathError_greaterthan_shouldReturnNonEmptyErrorMessage = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetPathError_greaterthan_shouldReturnNonEmptyErrorMessage:\n");
    const lib = require('./index');

    const errorMessage = lib.__getPathError__('foo>bar');
    t.assertEquals('string', typeof errorMessage);
    t.assertNotEquals('', errorMessage.trim());

    t.assertNotEquals('', lib.__getPathError__('>foobar').trim());
    t.assertNotEquals('', lib.__getPathError__('foobar>').trim());
                                                                                                                        if (verbose) log.info("OK: " + errorMessage);
}

exports.testGetPathError_colon_shouldReturnNonEmptyErrorMessage = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGetPathError_colon_shouldReturnNonEmptyErrorMessage:\n");
    const lib = require('./index');

    const errorMessage = lib.__getPathError__('foo:bar');
    t.assertEquals('string', typeof errorMessage);
    t.assertNotEquals('', errorMessage.trim());

    t.assertNotEquals('', lib.__getPathError__(':foobar').trim());
    t.assertNotEquals('', lib.__getPathError__('foobar:').trim());
                                                                                                                        if (verbose) log.info("OK: " + errorMessage);
}

*/







//////////////////////////////////////////////////////////////////////  TEST .static

/*
exports.testStatic_fail_missingRoot_shouldThrowError = () => {
    const lib = require('./index');

    let getStatic, failed = true;
    try {
        getStatic = lib.static();
        failed = false;
    } catch (e) {
        log.info("Ok - errorMessage as expected: " + e.message);
    }
    t.assertTrue(failed, "Should have failed");
    t.assertTrue(!getStatic, "Should not have produced a getStatic function");
}

exports.testStatic_fail_missingRoot_shouldThrowErrorEvenOnFalseThrowerrorsOption = () => {
    const lib = require('./index');

    let getStatic, failed = true;
    try {
        getStatic = lib.static({throwErrors: false});
        failed = false;
    } catch (e) {
        log.info("Ok - errorMessage as expected: " + e.message);
    }
    t.assertTrue(failed, "Should have failed");
    t.assertTrue(!getStatic, "Should not have produced a getStatic function");
}

exports.testStatic_fail_emptyRoot_argRoot_shouldThrowError = () => {
    const lib = require('./index');

    let getStatic, failed = true;
    try {
        getStatic = lib.static('');
        failed = false;
    } catch (e) {
        log.info("Ok - errorMessage as expected: " + e.message);
    }
    t.assertTrue(failed, "Should have failed");
    t.assertTrue(!getStatic, "Should not have produced a getStatic function");
}

exports.testStatic_fail_emptyRoot_argOption_shouldThrowError = () => {
    const lib = require('./index');

    let getStatic, failed = true;
    try {
        getStatic = lib.static({root: ''});
        failed = false;
    } catch (e) {
        log.info("Ok - errorMessage as expected: " + e.message);
    }
    t.assertTrue(failed, "Should have failed");
    t.assertTrue(!getStatic, "Should not have produced a getStatic function");
}

exports.testStatic_fail_emptyRoot_argOption_shouldThrowErrorEvenOnFalseThrowerrorsOption = () => {
    const lib = require('./index');

    let getStatic, failed = true;
    try {
        getStatic = lib.static({root: '', throwErrors: false});
        failed = false;
    } catch (e) {
        log.info("Ok - errorMessage as expected: " + e.message);
    }
    t.assertTrue(failed, "Should have failed");
    t.assertTrue(!getStatic, "Should not have produced a getStatic function");
}

exports.testStatic_fail_spacesRoot_argRoot_shouldThrowError = () => {
    const lib = require('./index');

    let getStatic, failed = true;
    try {
        getStatic = lib.static('  ');
        failed = false;
    } catch (e) {
        log.info("Ok - errorMessage as expected: " + e.message);
    }
    t.assertTrue(failed, "Should have failed");
    t.assertTrue(!getStatic, "Should not have produced a getStatic function");
}
exports.testStatic_fail_spacesRoot_argOption_shouldThrowError = () => {
    const lib = require('./index');

    let getStatic, failed = true;
    try {
        getStatic = lib.static({root: '  '});
        failed = false;
    } catch (e) {
        log.info("Ok - errorMessage as expected: " + e.message);
    }
    t.assertTrue(failed, "Should have failed");
    t.assertTrue(!getStatic, "Should not have produced a getStatic function");
}

exports.testStatic_fail_illegalCharRoot_argRoot_shouldThrowError = () => {
    const lib = require('./index');

    let getStatic, failed = true;
    try {
        getStatic = lib.static('illegal:path');
        failed = false;
    } catch (e) {
        log.info("Ok - errorMessage as expected: " + e.message);
    }
    t.assertTrue(failed, "Should have failed");
    t.assertTrue(!getStatic, "Should not have produced a getStatic function");
}
exports.testStatic_fail_illegalCharRoot_argOption_shouldThrowError = () => {
    const lib = require('./index');

    let getStatic, failed = true;
    try {
        getStatic = lib.static({root: 'illegal:path'});
        failed = false;
    } catch (e) {
        log.info("Ok - errorMessage as expected: " + e.message);
    }
    t.assertTrue(failed, "Should have failed");
    t.assertTrue(!getStatic, "Should not have produced a getStatic function");
}

exports.testStatic_fail_illegalDoubleDotRoot_argRoot_shouldThrowError = () => {
    const lib = require('./index');

    let getStatic, failed = true;
    try {
        getStatic = lib.static('illegal/../path');
        failed = false;
    } catch (e) {
        log.info("Ok - errorMessage as expected: " + e.message);
    }
    t.assertTrue(failed, "Should have failed");
    t.assertTrue(!getStatic, "Should not have produced a getStatic function");
}
exports.testStatic_fail_illegalDoubleDotRoot_argOption_shouldThrowError = () => {
    const lib = require('./index');

    let getStatic, failed = true;
    try {
        getStatic = lib.static({root: 'illegal/../path'});
        failed = false;
    } catch (e) {
        log.info("Ok - errorMessage as expected: " + e.message);
    }
    t.assertTrue(failed, "Should have failed");
    t.assertTrue(!getStatic, "Should not have produced a getStatic function");
}

exports.testStatic_fail_illegalSlashRoot_argRoot_shouldThrowError = () => {
    const lib = require('./index');

    let getStatic, failed = true;
    try {
        getStatic = lib.static('/');
        failed = false;
    } catch (e) {
        log.info("Ok - errorMessage as expected: " + e.message);
    }
    t.assertTrue(failed, "Should have failed");
    t.assertTrue(!getStatic, "Should not have produced a getStatic function");
}
exports.testStatic_fail_illegalSlashRoot_argOption_shouldThrowError = () => {
    const lib = require('./index');

    let getStatic, failed = true;
    try {
        getStatic = lib.static({root: '/'});
        failed = false;
    } catch (e) {
        log.info("Ok - errorMessage as expected: " + e.message);
    }
    t.assertTrue(failed, "Should have failed");
    t.assertTrue(!getStatic, "Should not have produced a getStatic function");
}

exports.testStatic_fail_illegalTypeRoot_argRoot_shouldThrowError = () => {
    const lib = require('./index');

    let getStatic, failed = true;
    try {
        getStatic = lib.static(42);
        failed = false;
    } catch (e) {
        log.info("Ok - errorMessage as expected: " + e.message);
    }
    t.assertTrue(failed, "Should have failed");
    t.assertTrue(!getStatic, "Should not have produced a getStatic function");
}
exports.testStatic_fail_illegalTypeRoot_argOption_shouldThrowError = () => {
    const lib = require('./index');

    let getStatic, failed = true;
    try {
        getStatic = lib.static({root: 42});
        failed = false;
    } catch (e) {
        log.info("Ok - errorMessage as expected: " + e.message);
    }
    t.assertTrue(failed, "Should have failed");
    t.assertTrue(!getStatic, "Should not have produced a getStatic function");
}

exports.testStatic_fail_illegalArrayRoot_argRoot_shouldThrowError = () => {
    const lib = require('./index');

    let getStatic, failed = true;
    try {
        getStatic = lib.static(["this", "is", "no", "good"]);
        failed = false;
    } catch (e) {
        log.info("Ok - errorMessage as expected: " + e.message);
    }
    t.assertTrue(failed, "Should have failed");
    t.assertTrue(!getStatic, "Should not have produced a getStatic function");
}
exports.testStatic_fail_illegalZeroRoot_argOption_shouldThrowError = () => {
    const lib = require('./index');

    let getStatic, failed = true;
    try {
        getStatic = lib.static({root: 0});
        failed = false;
    } catch (e) {
        log.info("Ok - errorMessage as expected: " + e.message);
    }
    t.assertTrue(failed, "Should have failed");
    t.assertTrue(!getStatic, "Should not have produced a getStatic function");
}


exports.testStatic_fail_optionParsingError_arg2_shouldThrowError = () => {
    const lib = require('./index');

    let getStatic, failed = true;
    try {
        getStatic = lib.static('assets', {etag: ["not", "valid"]});
        failed = false;
    } catch (e) {
        log.info("Ok - errorMessage as expected: " + e.message);
    }
    t.assertTrue(failed, "Should have failed");
    t.assertTrue(!getStatic, "Should not have produced a getStatic function");
}
exports.testStatic_fail_optionParsingError_arg2_shouldThrowErrorEvenWithThrowErrorsFalse = () => {
    const lib = require('./index');

    let getStatic, failed = true;
    try {
        getStatic = lib.static('assets', {etag: ["not", "valid"], throwErrors: false});
        failed = false;
    } catch (e) {
        log.info("Ok - errorMessage as expected: " + e.message);
    }
    t.assertTrue(failed, "Should have failed");
    t.assertTrue(!getStatic, "Should not have produced a getStatic function");
}
exports.testStatic_fail_optionParsingError_arg1_shouldThrowError = () => {
    const lib = require('./index');

    let getStatic, failed = true;
    try {
        getStatic = lib.static({root: 'assets', etag: ["not", "valid"]});
        failed = false;
    } catch (e) {
        log.info("Ok - errorMessage as expected: " + e.message);
    }
    t.assertTrue(failed, "Should have failed");
    t.assertTrue(!getStatic, "Should not have produced a getStatic function");
}
exports.testStatic_fail_optionParsingError_arg1_shouldThrowErrorEvenWithThrowErrorsFalse = () => {
    const lib = require('./index');

    let getStatic, failed = true;
    try {
        getStatic = lib.static({root: 'assets', etag: ["not", "valid"], throwErrors: false});
        failed = false;
    } catch (e) {
        log.info("Ok - errorMessage as expected: " + e.message);
    }
    t.assertTrue(failed, "Should have failed");
    t.assertTrue(!getStatic, "Should not have produced a getStatic function");
}


//////////////////////////////////////////////////////////////////////////////////  Test the returned getStatic func

exports.testGetStatic_root_Asset_FullDefaultResponse = () => {
    const lib = require('./index');

    const getStatic = lib.static('assets');            // Root folder: '/assets/'

    // Simulate an XP GET request from frontend
    const request = {
        rawPath: 'my/endpoint/asset-test-target.txt',              // This path, in context of contextPath, yields the relative path 'asset-test-target.txt',
        contextPath: 'my/endpoint'                              // which together with the root folder 'assets' becomes the full asset path: 'assets/asset-test-target.txt'
    };

    const result = getStatic(request);

    t.assertEquals("I am a test asset\n", ioLib.readText(result.body));
    t.assertEquals(200, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);

    log.info(".static example: full get response readout, body is a resource object (" +
        (typeof result + (result && typeof result === 'object' ? (" with keys: " + JSON.stringify(Object.keys(result))) : "")
        ) + "): " + JSON.stringify(result, null, 2)
    );
};


exports.testGetStatic_optionsRoot = () => {
    const lib = require('./index');

    const getStatic = lib.static({root: 'assets'});            // Root folder: '/assets/'

    // Simulate an XP GET request from frontend
    const request = {
        rawPath: 'my/endpoint/asset-test-target.txt',              // This path, in context of contextPath, yields the relative path 'asset-test-target.txt',
        contextPath: 'my/endpoint'                              // which together with the root folder 'assets' becomes the full asset path: 'assets/asset-test-target.txt'
    };

    const result = getStatic(request);

    t.assertEquals("I am a test asset\n", ioLib.readText(result.body));
    t.assertEquals(200, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
};

exports.testGetStatic_ifNoneMatch_matchingEtagValues_should304 = () => {
    const lib = require('./index');

    const getStatic = lib.static('assets');

    const request = {
        rawPath: 'my/endpoint/asset-test-target.txt',
        contextPath: 'my/endpoint',
        headers: {
            'If-None-Match': 'djsptplmcdcidp39wx6ydiwn3'        // <-- TODO: Copied from output. Should mock instead.
        }
    };

    const result = getStatic(request);

    t.assertEquals(304, result.status);
};

exports.testGetStatic_ifNoneMatch_nonMatchingEtagValues_should200WithUpdatedContentAndEtag = () => {
    const lib = require('./index');

    const getStatic = lib.static('assets');

    const request = {
        rawPath: 'my/endpoint/asset-test-target.txt',
        contextPath: 'my/endpoint',
        headers: {
            'If-None-Match': 'oldEtagValue87654321'
        }
    };

    const result = getStatic(request);

    t.assertEquals("I am a test asset\n", ioLib.readText(result.body));
    t.assertEquals(200, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
    t.assertTrue(!!(result.headers || {}).ETag); // An ETag header should be generated
    t.assertNotEquals("oldEtagValue87654321", (result.headers || {}).ETag); // a NEW ETag header should be generated
};

exports.testGetStatic_option_arg2_getCleanPath = () => {
    const lib = require('./index');

    const getStatic = lib.static('assets', {
        getCleanPath: request =>  request.rawPath.substring('my/endpoint'.length)
    });

    // Simulate an XP GET request from a frontend that's NOT a prefix that leaves a relative asset path:
    const request = {
        rawPath: 'my/endpoint/asset-test-target.txt',               // Uses the getCleanPath option instead of the contextPath, to return the relative path 'asset-test-target.txt',
        contextPath: 'this/is/ignored'                              // which together with the root folder 'assets' becomes the full asset rawPath: 'assets/asset-test-target.txt'
    };

    const result = getStatic(request);

    t.assertEquals("I am a test asset\n", ioLib.readText(result.body));
    t.assertEquals(200, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
};

exports.testGetStatic_option_arg1_getCleanPath = () => {
    const lib = require('./index');

    const getStatic = lib.static({
        root: 'assets',
        getCleanPath: request =>  request.rawPath.substring('my/endpoint'.length)
    });

    // Simulate an XP GET request from a frontend that's NOT a prefix that leaves a relative asset path:
    const request = {
        rawPath: 'my/endpoint/asset-test-target.txt',               // Uses the getCleanPath option instead of the contextPath, to return the relative path 'asset-test-target.txt',
        contextPath: 'this/is/ignored'                              // which together with the root folder 'assets' becomes the full asset rawPath: 'assets/asset-test-target.txt'
    };

    const result = getStatic(request);

    t.assertEquals("I am a test asset\n", ioLib.readText(result.body));
    t.assertEquals(200, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
};


exports.testGetStatic_HTML_FullDefaultResponse = () => {
    const lib = require('./index');


    const getStatic = lib.static('static');
    const request = {
        rawPath: 'my/endpoint/static-test-html.html',
        contextPath: 'my/endpoint'
    };                                                  // --> /static/static-test-html.html

    const result = getStatic(request);

    t.assertEquals("<html><body><p>I am a test HTML</p></body></html>\n", ioLib.readText(result.body));
    t.assertEquals(200, result.status);
    t.assertTrue(!!result.contentType);
    t.assertTrue(result.contentType.indexOf("text/html") !== -1);

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
};

exports.testGetStatic_Css = () => {
    const lib = require('./index');

    const getStatic = lib.static('static');
    const request = {
        rawPath: 'my/endpoint/static-test-css.css',
        contextPath: 'my/endpoint'
    };                                                  // --> /static/static-test-css.css

    const result = getStatic(request);

    t.assertTrue(!!result.contentType);
    t.assertTrue(result.contentType.indexOf("text/css") !== -1);
    t.assertEquals(".i.am.a.test.css {\n\n}\n", ioLib.readText(result.body));

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
};

exports.testGetStatic_JS = () => {
    const lib = require('./index');

    const getStatic = lib.static('static');
    const request = {
        rawPath: 'my/endpoint/static-test-js.js',
        contextPath: 'my/endpoint'
    };                                                  // --> /static/static-test-js.js

    const result = getStatic(request);


    t.assertTrue(!!result.contentType);
    t.assertTrue(result.contentType.indexOf("application/javascript") !== -1);
    t.assertEquals("console.log(\"I am a test js\");\n", ioLib.readText(result.body));

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
};

exports.testGetStatic_JSON = () => {
    const lib = require('./index');

    const getStatic = lib.static('static');
    const request = {
        rawPath: 'my/endpoint/static-test-json.json',
        contextPath: 'my/endpoint'
    };                                                  // --> /static/static-test-json.json

    const result = getStatic(request);

    t.assertTrue(!!result.contentType);
    t.assertTrue(result.contentType.indexOf("application/json") !== -1);
    t.assertEquals(`{
  "I": {
    "am": "a",
    "test": "json"
  }
}
`, ioLib.readText(result.body));

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
};

exports.testGetStatic_XML = () => {
    const lib = require('./index');

    const getStatic = lib.static('static');
    const request = {
        rawPath: 'my/endpoint/static-test-xml.xml',
        contextPath: 'my/endpoint'
    };                                                  // --> /static/static-test-xml.xml

    const result = getStatic(request);

    t.assertTrue(!!result.contentType);
    t.assertTrue(result.contentType.indexOf("text/xml") !== -1);
    t.assertEquals(`<I>
    <am>a</am>
    <test>xml</test>
</I>
`, ioLib.readText(result.body));

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
}

exports.testGetStatic_Text = () => {
    const lib = require('./index');

    const getStatic = lib.static('static');
    const request = {
        rawPath: 'my/endpoint/static-test-text.txt',
        contextPath: 'my/endpoint'
    };                                                  // --> /static/static-test-text.txt

    const result = getStatic(request);

    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
    t.assertEquals("I am a test text\n", ioLib.readText(result.body));

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
}

exports.testGetStatic_JPG = () => {
    const lib = require('./index');

    const getStatic = lib.static('static');
    const request = {
        rawPath: 'my/endpoint/w3c_home.jpg',
        contextPath: 'my/endpoint'
    };                                                  // --> /static/w3c_home.jpg

    const result = getStatic(request);

    t.assertEquals(200, result.status);
    t.assertTrue(!!result.contentType);
    t.assertTrue(result.contentType.indexOf("image/jpeg") !== -1);

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
};

exports.testGetStatic_GIF = () => {
    const lib = require('./index');

    const getStatic = lib.static('static');
    const request = {
        rawPath: 'my/endpoint/w3c_home.gif',
        contextPath: 'my/endpoint'
    };                                                  // --> /static/w3c_home.gif

    const result = getStatic(request);

    t.assertEquals(200, result.status);
    t.assertTrue(!!result.contentType);
    t.assertTrue(result.contentType.indexOf("image/gif") !== -1);

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
};


/////////////  Test getStatic errorHandling


exports.testGetStatic_fail_rootArg_NotFoundFile_should404 = () => {
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
exports.testGetStatic_fail_optionsArg_NotFoundFile_should404 = () => {
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
exports.testGetStatic_fail_NotFoundInRoot_should404 = () => {
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

exports.testGetStatic_fail_empty_should400 = () => {
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

exports.testGetStatic_fail_slash_should400 = () => {
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
exports.testGetStatic_fail_slashes_should400 = () => {
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
exports.testGetStatic_fail_illegalChars_should400 = () => {
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
exports.testGetStatic_fail_illegalDoubledots_should400 = () => {
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
exports.testGetStatic_fail_illegalWildcards_should400 = () => {
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
exports.testGetStatic_fail_pathNotUnderContextPath_should500 = () => {
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


exports.testGetStatic_fail_contentTypeFunc_runtimeError_should500withMessage = () => {
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
exports.testGetStatic_fail_contentTypeFunc_runtimeError_throwErrors = () => {
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


exports.testGetStatic_fail_cacheControlFunc_runtimeError_should500withMessage = () => {
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
exports.testGetStatic_fail_cacheControlFunc_runtimeError_throwErrors = () => {
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
exports.testGetStatic_fail_failuresShouldNotDestroyGetstaticFunction = () => {
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
