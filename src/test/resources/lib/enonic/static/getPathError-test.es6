const DEFAULT_CACHE_CONTROL = require('/lib/enonic/static/options').DEFAULT_CACHE_CONTROL;

const ioMock = require('/lib/enonic/static/ioMock');

const __getPathError__ = require('./index').__getPathError__;

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
                                                                                                                        if (verbose) log.info(prettify(params, "--- Mocking with params"));

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
                path: (io.path !== undefined)
                    ? io.path
                    : path,
                exists: (io.exists !== undefined)
                    ? io.exists
                    : true,
            };
            data.content = (io.content !== undefined)
                ? io.content
                : `Mocked content of '${data.path}'`;

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
    if (verbose) log.info(prettify(mockedIoFuncs, "mockedIoFuncs"));
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

exports.testGet_innerbehavior_removesLeadingPathSlashesFromPathBefore__GetPathError__ = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_innerbehavior_removesLeadingPathSlashesFromPathBefore__GetPathError__:\n");
    doMocks({}, verbose);
    const lib = require('./index');

    let getPathErrorWasCalled = false;
    lib.__getPathError__ = (path) => {
        t.assertEquals('my/path', path);  // getPathError should always be called without leading slash in path
        getPathErrorWasCalled = true;
    }

    lib.get('/my/path');

    t.assertTrue(getPathErrorWasCalled, "getPathErrorWasCalled");
}



exports.testGet_innerbehaviour_getPathError_stringArg_isCalled = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_innerbehaviour_getPathError_stringArg_isCalled:\n");
    doMocks({
        },
        verbose);
    const lib = require('./index');

    let target = undefined;

    // Mock an inner function to verify it's called with the path param
    lib.__getPathError__ = (path) => {
        target = path;
        return undefined;
    }

    const result = lib.get("my/unique/testing/path");

    t.assertEquals("my/unique/testing/path", target);
                                                                                                                        if (verbose) log.info(prettify(result, "result"));
}


exports.testGet_innerbehaviour_getPathError_optionArg_isCalled = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_innerbehaviour_getPathError_optionArg_isCalled:\n");
    doMocks({
        },
        verbose);
    const lib = require('./index');

    let target = undefined;

    // Mock an inner function to verify it's called with the path param
    lib.__getPathError__ = (path) => {
        target = path;
        return undefined;
    }

    const result = lib.get({path: "another/unique/testing/path"});
                                                                                                                        if (verbose) log.info(prettify(result, "result"));
    t.assertEquals("another/unique/testing/path", target);

}


exports.testGet_innerbehaviour_getPathError_isUsed = () => {
    const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestGet_innerbehaviour_getPathError_isUsed:\n");

    doMocks({
        },
        verbose);
    const lib = require('./index');

    // Mock an inner function to verify it's called with the path param
    lib.__getPathError__ = () => {
        return "This was a path error thrown on purpose";
    }

    const result = lib.get({path: "yet/another/unique/testing/path"});
                                                                                                                        if (verbose) log.info(prettify(result, "result"));

    t.assertEquals(400, result.status, "result.status");
    log.info("OK")
                                                                                                                        if (verbose) t.assertTrue(false, "OK");
}





//////////////////////////////////////////////////////////////////  TEST .buildGetter

exports.testbuildGetter_innerbehavior_removesLeadingPathSlashesFromPathBefore__GetPathError__ = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestbuildGetter_innerbehavior_removesLeadingPathSlashesFromPathBefore__GetPathError__:\n");
    doMocks({}, verbose);
    const lib = require('./index');

    let getPathErrorWasCalled = false;
    lib.__getPathError__ = (path) => {
        t.assertEquals('my/path', path);  // getPathError should always be called without leading slash in path
        getPathErrorWasCalled = true;
    }

    lib.buildGetter('/my/path');

    t.assertTrue(getPathErrorWasCalled, "getPathErrorWasCalled");
}



exports.testbuildGetter_innerbehaviour_getPathError_stringArg_isCalled = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestbuildGetter_innerbehaviour_getPathError_stringArg_isCalled:\n");
    doMocks({
        },
        verbose);
    const lib = require('./index');

    let target = undefined;

    // Mock an inner function to verify it's called with the path param
    lib.__getPathError__ = (path) => {
        target = path;
    }

    lib.buildGetter("my/unique/testing/path");

    t.assertEquals("my/unique/testing/path", target);
}


exports.testbuildGetter_innerbehaviour_getPathError_optionArg_isCalled = () => {
    const verbose = true;
                                                                                                                        if (verbose) log.info("\n\n\ntestbuildGetter_innerbehaviour_getPathError_optionArg_isCalled:\n");
    doMocks({
        },
        verbose);
    const lib = require('./index');

    let target = undefined;

    // Mock an inner function to verify it's called with the path param
    lib.__getPathError__ = (path) => {
        target = path;
    }

    lib.buildGetter({root: "another/unique/testing/path"});

    t.assertEquals("another/unique/testing/path", target);

}


exports.testbuildGetter_innerbehaviour_getPathError_isUsed = () => {
                                                                                                                        if (verbose) log.info("\n\n\ntestbuildGetter_innerbehaviour_getPathError_isUsed:\n");

    doMocks({
        },
        verbose);
    const lib = require('./index');

    // Mock an inner function to verify it's called with the path param
    lib.__getPathError__ = () => {
        return "This was a path error thrown on purpose";
    }

    let failed = true;
    try {
        lib.buildGetter({path: "yet/another/unique/testing/path"});
        failed = false;
    } catch (e) {
                                                                                                                        if (verbose) log.error(e);
    }

    t.assertTrue(failed, "getPathError should have caused .buildGetter to fail");
    log.info("OK");
}



/////////////////////////////////////////////////////////  TEST .getPathError


/*
const illegalCharsRx = /[<>:"'`´\\|?*]/;
// Exported for testing only
exports.__getPathError__ = (trimmedPathString) => {
    if (trimmedPathString.match(illegalCharsRx)) {
        return "can't contain '..' or any of these characters: \\ | ? * < > ' \" ` ´";
    }
    if (!trimmedPathString) {
        return "is empty, all-spaces or directly at root ('/')";
    }
};
 */
exports.test__getPathError__allowsPureStringsAndSlashesAndSpacesAndSingleDots = () => {
    t.assertEquals(undefined, __getPathError__("hello"), "error from pure string");
    t.assertEquals(undefined, __getPathError__("hel/lo"), "error from inner slash");
    t.assertEquals(undefined, __getPathError__("/hello"), "error from leading slash");
    t.assertEquals(undefined, __getPathError__("hello/"), "error from trailing slash");
    t.assertEquals(undefined, __getPathError__("hel lo"), "error from inner space");
    // No tests for leading/trailing spaces, since input path is expected to be trimmed from the pathAndOptionsParser
    t.assertEquals(undefined, __getPathError__("hællå"), "error from special characters");
    t.assertEquals(undefined, __getPathError__("h%ll$"), "error from % $");
    t.assertEquals(undefined, __getPathError__("hel.lo"), "error from inner single dot");
    t.assertEquals(undefined, __getPathError__("hel/.lo"), "error from /inner single dot");
    t.assertEquals(undefined, __getPathError__("hel./lo"), "error from inner/ single dot");
    t.assertEquals(undefined, __getPathError__("hel/./lo"), "error from /inner/ single dot");
    t.assertEquals(undefined, __getPathError__(".hello"), "error from leading single dot");
    t.assertEquals(undefined, __getPathError__("./hello"), "error from leading/ single dot");
    t.assertEquals(undefined, __getPathError__("/./hello"), "error from /leading/ single dot");
    t.assertEquals(undefined, __getPathError__(".hello"), "error from trailing single dot");
    t.assertEquals(undefined, __getPathError__("hello/."), "error from /trailing single dot");
    t.assertEquals(undefined, __getPathError__("hello/./"), "error from /trailing/ single dot");
};

exports.test__getPathError__preventsDoubleDotsAndMore = () => {
    t.assertTrue(!!__getPathError__("hel..lo"), "error from inner double dot");
    t.assertTrue(!!__getPathError__("hel/..lo"), "error from /inner double dot");
    t.assertTrue(!!__getPathError__("hel../lo"), "error from inner/ double dot");
    t.assertTrue(!!__getPathError__("hel/../lo"), "error from /inner/ double dot");
    t.assertTrue(!!__getPathError__("..hello"), "error from leading double dot");
    t.assertTrue(!!__getPathError__("../hello"), "error from leading/ double dot");
    t.assertTrue(!!__getPathError__("/..hello"), "error from /leading double dot");
    t.assertTrue(!!__getPathError__("/../hello"), "error from /leading/ double dot");
    t.assertTrue(!!__getPathError__("hello.."), "error from trailing double dot");
    t.assertTrue(!!__getPathError__("hello/.."), "error from /trailing double dot");
    t.assertTrue(!!__getPathError__("hello../"), "error from trailing/ double dot");
    t.assertTrue(!!__getPathError__("hello/../"), "error from /trailing/ double dot");

    t.assertTrue(!!__getPathError__("hel../..lo"), "error from inner double dot");
    t.assertTrue(!!__getPathError__("hel/../..lo"), "error from /inner double double dot");
    t.assertTrue(!!__getPathError__("hel../../lo"), "error from inner/ double double dot");
    t.assertTrue(!!__getPathError__("hel/../../lo"), "error from /inner/ double double dot");
    t.assertTrue(!!__getPathError__("../..hello"), "error from leading double double dot");
    t.assertTrue(!!__getPathError__("../../hello"), "error from leading/ double double dot");
    t.assertTrue(!!__getPathError__("/../..hello"), "error from /leading double double dot");
    t.assertTrue(!!__getPathError__("/../../hello"), "error from /leading/ double double dot");
    t.assertTrue(!!__getPathError__("hello../.."), "error from trailing double double dot");
    t.assertTrue(!!__getPathError__("hello../../"), "error from /trailing double double dot");
    t.assertTrue(!!__getPathError__("hello../../"), "error from trailing/ double double dot");
    t.assertTrue(!!__getPathError__("hello/../../"), "error from /trailing/ double double dot");

    t.assertTrue(!!__getPathError__("hel...lo"), "error from inner triple dot");
    t.assertTrue(!!__getPathError__("hel/...lo"), "error from /inner triple dot");
    t.assertTrue(!!__getPathError__("hel.../lo"), "error from inner/ triple dot");
    t.assertTrue(!!__getPathError__("hel/.../lo"), "error from /inner/ triple dot");
    t.assertTrue(!!__getPathError__("...hello"), "error from leading triple dot");
    t.assertTrue(!!__getPathError__(".../hello"), "error from leading/ triple dot");
    t.assertTrue(!!__getPathError__("/...hello"), "error from /leading triple dot");
    t.assertTrue(!!__getPathError__("/.../hello"), "error from /leading/ triple dot");
    t.assertTrue(!!__getPathError__("hello..."), "error from trailing triple dot");
    t.assertTrue(!!__getPathError__("hello/..."), "error from /trailing triple dot");
    t.assertTrue(!!__getPathError__("hello.../"), "error from trailing/ triple dot");
    t.assertTrue(!!__getPathError__("hello/.../"), "error from /trailing/ triple dot");
};

exports.test__getPathError__preventsBackslash = () => {
    t.assertTrue(!!__getPathError__("hel\\lo"), "error from inner backslash");
    t.assertTrue(!!__getPathError__("hel\\\\lo"), "error from inner double backslash");
    t.assertTrue(!!__getPathError__("\\hello"), "error from leading backslash");
    t.assertTrue(!!__getPathError__("\\\\hello"), "error from leading double backslash");
    t.assertTrue(!!__getPathError__("hello\\"), "error from trailing backslash");
    t.assertTrue(!!__getPathError__("hello\\\\"), "error from trailing double backslash");
}
exports.test__getPathError__preventsPipe = () => {
    t.assertTrue(!!__getPathError__("hel|lo"), "error from inner pipe");
    t.assertTrue(!!__getPathError__("hel||lo"), "error from inner double pipe");
    t.assertTrue(!!__getPathError__("|hello"), "error from leading pipe");
    t.assertTrue(!!__getPathError__("||hello"), "error from leading double pipe");
    t.assertTrue(!!__getPathError__("hello|"), "error from trailing pipe");
    t.assertTrue(!!__getPathError__("hello||"), "error from trailing double pipe");
}
exports.test__getPathError__preventsLesserThan = () => {
    t.assertTrue(!!__getPathError__("hel<lo"), "error from inner lt");
    t.assertTrue(!!__getPathError__("hel<<lo"), "error from inner double lt");
    t.assertTrue(!!__getPathError__("<hello"), "error from leading lt");
    t.assertTrue(!!__getPathError__("<<hello"), "error from leading double lt");
    t.assertTrue(!!__getPathError__("hello<"), "error from trailing lt");
    t.assertTrue(!!__getPathError__("hello<<"), "error from trailing double lt");
}
exports.test__getPathError__preventsGreaterThan = () => {
    t.assertTrue(!!__getPathError__("hel>lo"), "error from inner gt");
    t.assertTrue(!!__getPathError__("hel>>lo"), "error from inner double gt");
    t.assertTrue(!!__getPathError__(">hello"), "error from leading gt");
    t.assertTrue(!!__getPathError__(">>hello"), "error from leading double gt");
    t.assertTrue(!!__getPathError__("hello>"), "error from trailing gt");
    t.assertTrue(!!__getPathError__("hello>>"), "error from trailing double gt");
}
exports.test__getPathError__preventsSingleQuote = () => {
    t.assertTrue(!!__getPathError__("hel'lo"), "error from inner quote");
    t.assertTrue(!!__getPathError__("'hello"), "error from leading quote");
    t.assertTrue(!!__getPathError__("hello'"), "error from trailing quote");
    t.assertTrue(!!__getPathError__("'hello'"), "error from surrounding quote");
    t.assertTrue(!!__getPathError__("he'll'o"), "error from inner surrounding quote");
}
exports.test__getPathError__preventsDoubleQuote = () => {
    t.assertTrue(!!__getPathError__('hel"lo'), 'error from inner doublequote');
    t.assertTrue(!!__getPathError__('"hello'), 'error from leading doublequote');
    t.assertTrue(!!__getPathError__('hello"'), 'error from trailing doublequote');
    t.assertTrue(!!__getPathError__('"hello"'), 'error from surrounding doublequote');
    t.assertTrue(!!__getPathError__('he"ll"o'), 'error from inner surrounding doublequote');
}
exports.test__getPathError__preventsTick = () => {
    t.assertTrue(!!__getPathError__('hel´lo'), 'error from inner tick');
    t.assertTrue(!!__getPathError__('´hello'), 'error from leading tick');
    t.assertTrue(!!__getPathError__('hello´'), 'error from trailing tick');
    t.assertTrue(!!__getPathError__('´hello´'), 'error from surrounding tick');
    t.assertTrue(!!__getPathError__('he´ll´o'), 'error from inner surrounding tick');
}
exports.test__getPathError__preventsBackTick = () => {
    t.assertTrue(!!__getPathError__('hel`lo'), 'error from inner backtick');
    t.assertTrue(!!__getPathError__('`hello'), 'error from leading backtick');
    t.assertTrue(!!__getPathError__('hello`'), 'error from trailing backtick');
    t.assertTrue(!!__getPathError__('`hello`'), 'error from surrounding backtick');
    t.assertTrue(!!__getPathError__('he`ll`o'), 'error from inner surrounding backtick');
}
exports.test__getPathError__preventsQuestionMark = () => {
    t.assertTrue(!!__getPathError__("hel?lo"), "error from inner question mark");
    t.assertTrue(!!__getPathError__("hel??lo"), "error from inner double question mark");
    t.assertTrue(!!__getPathError__("hel?/?lo"), "error from in/ner double question mark");
    t.assertTrue(!!__getPathError__("?hello"), "error from leading question mark");
    t.assertTrue(!!__getPathError__("??hello"), "error from leading double question mark");
    t.assertTrue(!!__getPathError__("?/?hello"), "error from lea/ding double question mark");
    t.assertTrue(!!__getPathError__("hello?"), "error from trailing question mark");
    t.assertTrue(!!__getPathError__("hello??"), "error from trailing double question mark");
    t.assertTrue(!!__getPathError__("hello?/?"), "error from trai/ling double question mark");

    t.assertTrue(!!__getPathError__("hel/?lo"), "error from /inner question mark");
    t.assertTrue(!!__getPathError__("hel/??lo"), "error from /inner double question mark");
    t.assertTrue(!!__getPathError__("hel/?/?lo"), "error from /in/ner double question mark");
    t.assertTrue(!!__getPathError__("/?hello"), "error from /leading question mark");
    t.assertTrue(!!__getPathError__("/??hello"), "error from /leading double question mark");
    t.assertTrue(!!__getPathError__("/?/?hello"), "error from /lea/ding double question mark");
    t.assertTrue(!!__getPathError__("hello/?"), "error from /trailing question mark");
    t.assertTrue(!!__getPathError__("hello/??"), "error from /trailing double question mark");
    t.assertTrue(!!__getPathError__("hello/?/?"), "error from /trai/ling double question mark");

    t.assertTrue(!!__getPathError__("hel?/lo"), "error from inner/ question mark");
    t.assertTrue(!!__getPathError__("hel??/lo"), "error from inner/ double question mark");
    t.assertTrue(!!__getPathError__("hel?/?/lo"), "error from in/ner/ double question mark");
    t.assertTrue(!!__getPathError__("?/hello"), "error from leading/ question mark");
    t.assertTrue(!!__getPathError__("??/hello"), "error from leading/ double question mark");
    t.assertTrue(!!__getPathError__("?/?/hello"), "error from lea/ding/ double question mark");
    t.assertTrue(!!__getPathError__("hello?/"), "error from trailing/ question mark");
    t.assertTrue(!!__getPathError__("hello??/"), "error from trailing/ double question mark");
    t.assertTrue(!!__getPathError__("hello?/?/"), "error from trai/ling/ double question mark");

    t.assertTrue(!!__getPathError__("hel/?/lo"), "error from /inner/ question mark");
    t.assertTrue(!!__getPathError__("hel/??/lo"), "error from /inner/ double question mark");
    t.assertTrue(!!__getPathError__("hel/?/?/lo"), "error from /in/ner/ double question mark");
    t.assertTrue(!!__getPathError__("/?/hello"), "error from /leading/ question mark");
    t.assertTrue(!!__getPathError__("/??/hello"), "error from /leading/ double question mark");
    t.assertTrue(!!__getPathError__("/?/?/hello"), "error from /lea/ding/ double question mark");
    t.assertTrue(!!__getPathError__("hello/?/"), "error from /trailing/ question mark");
    t.assertTrue(!!__getPathError__("hello/??/"), "error from /trailing/ double question mark");
    t.assertTrue(!!__getPathError__("hello/?/?/"), "error from /trai/ling/ double question mark");
}

exports.test__getPathError__preventsStar = () => {
    t.assertTrue(!!__getPathError__("hel*lo"), "error from inner star");
    t.assertTrue(!!__getPathError__("hel**lo"), "error from inner double star");
    t.assertTrue(!!__getPathError__("hel*/*lo"), "error from in/ner double star");
    t.assertTrue(!!__getPathError__("*hello"), "error from leading star");
    t.assertTrue(!!__getPathError__("**hello"), "error from leading double star");
    t.assertTrue(!!__getPathError__("*/*hello"), "error from lea/ding double star");
    t.assertTrue(!!__getPathError__("hello*"), "error from trailing star");
    t.assertTrue(!!__getPathError__("hello**"), "error from trailing double star");
    t.assertTrue(!!__getPathError__("hello*/*"), "error from trai/ling double star");

    t.assertTrue(!!__getPathError__("hel/*lo"), "error from /inner star");
    t.assertTrue(!!__getPathError__("hel/**lo"), "error from /inner double star");
    t.assertTrue(!!__getPathError__("hel/*/*lo"), "error from /in/ner double star");
    t.assertTrue(!!__getPathError__("/*hello"), "error from /leading star");
    t.assertTrue(!!__getPathError__("/**hello"), "error from /leading double star");
    t.assertTrue(!!__getPathError__("/*/*hello"), "error from /lea/ding double star");
    t.assertTrue(!!__getPathError__("hello/*"), "error from /trailing star");
    t.assertTrue(!!__getPathError__("hello/**"), "error from /trailing double star");
    t.assertTrue(!!__getPathError__("hello/*/*"), "error from /trai/ling double star");

    t.assertTrue(!!__getPathError__("hel*/lo"), "error from inner/ star");
    t.assertTrue(!!__getPathError__("hel**/lo"), "error from inner/ double star");
    t.assertTrue(!!__getPathError__("hel*/*/lo"), "error from in/ner/ double star");
    t.assertTrue(!!__getPathError__("*/hello"), "error from leading/ star");
    t.assertTrue(!!__getPathError__("**/hello"), "error from leading/ double star");
    t.assertTrue(!!__getPathError__("*/*/hello"), "error from lea/ding/ double star");
    t.assertTrue(!!__getPathError__("hello*/"), "error from trailing/ star");
    t.assertTrue(!!__getPathError__("hello**/"), "error from trailing/ double star");
    t.assertTrue(!!__getPathError__("hello*/*/"), "error from trai/ling/ double star");

    t.assertTrue(!!__getPathError__("hel/*/lo"), "error from /inner/ star");
    t.assertTrue(!!__getPathError__("hel/**/lo"), "error from /inner/ double star");
    t.assertTrue(!!__getPathError__("hel/*/*/lo"), "error from /in/ner/ double star");
    t.assertTrue(!!__getPathError__("/*/hello"), "error from /leading/ star");
    t.assertTrue(!!__getPathError__("/**/hello"), "error from /leading/ double star");
    t.assertTrue(!!__getPathError__("/*/*/hello"), "error from /lea/ding/ double star");
    t.assertTrue(!!__getPathError__("hello/*/"), "error from /trailing/ star");
    t.assertTrue(!!__getPathError__("hello/**/"), "error from /trailing/ double star");
    t.assertTrue(!!__getPathError__("hello/*/*/"), "error from /trai/ling/ double star");
}
exports.test__getPathError__preventsEmptyPath = () => {
    t.assertTrue(!!__getPathError__(""), "error from empty path");
}
