const DEFAULT_CACHE_CONTROL = require('/lib/enonic/static/options').DEFAULT_CACHE_CONTROL;

const ioMock = require('/lib/enonic/static/ioMock');

const t = require('/lib/xp/testing');


//////////////////////////////////////////////////////////////////  TEST .get

// Specific mocking for each unit test, since doing it in the global namespace affects other tests.
// E.g.: const lib = require('./index');
const mockLib = (params={}) => {
    const runMode = params.runMode || {};
    t.mock('/lib/enonic/static/runMode.js', {
        isDev: () => runMode.isDev || false
    });

    const io = params.io || {};
    t.mock('/lib/enonic/static/io.js', {
        getResource: (path) => {
            log.info("ioMock.getResource path: " + JSON.stringify(path));
            return ioMock.getResource(io.path || path, io.exists, io.content);
        },
        readText: (stream) => {
            log.info("ioMock.readText");
            return io.readText || ioMock.readText(stream)
        },
        getMimeType: (name) => {
            log.info("ioMock.getMimeType name: " + JSON.stringify(name));
            return io.mimeType || ioMock.getMimeType(name)
        },
    });

    const etagReader = params.etagReader || {};
    t.mock('/lib/enonic/static/etagReader.js', {
        read: (path, etagOverride) => {
            log.info("etagReaderMock.read: " + JSON.stringify({path, etagOverride}));
            return etagReader.etag;
        }
    });

    const defaultOptions = {
        contentTypeFunc: ioMock.getMimeType,
        cacheControlFunc: () => DEFAULT_CACHE_CONTROL
    };
    t.mock('/lib/enonic/static/options.js', {
        // DEFAULT_CACHE_CONTROL: DEFAULT_CACHE_CONTROL,
        parsePathAndOptions: (pathOrOptions, options) => {
            const parsed = (typeof pathOrOptions === 'string')
                ? { path: pathOrOptions, ...defaultOptions, ...options }
                : { ...pathOrOptions };
            log.info("optionsParserMock.parsePathAndOptions - parsed: " + JSON.stringify(parsed));
            return parsed;

        },
        parseRootAndOptions: (rootOrOptions, options) => {
            const parsed = (typeof rootOrOptions === 'string')
                ? { root: rootOrOptions, ...defaultOptions, ...options }
                : { ...rootOrOptions };
            log.info("optionsParserMock.parseRootAndOptions - parsed: " + JSON.stringify(rootOrOptions));
            return parsed;
        }
    });

    return require('./index');
}



// Path string argument

exports.testGet_path_FullDefaultResponse = () => {
    const lib = mockLib({
        io: {
            content: "I am the content of /assets/asset-test-target.txt"
        },
        etagReader: {
            etag: "expectedEtag1234567890"
        }
    });

    const result = lib.get('/assets/asset-test-target.txt');

    log.info(".get: full get response readout (" +
        (typeof result +
            (result && typeof result === 'object'
                ? (" with keys: " + JSON.stringify(Object.keys(result)))
                : ""
            )
        ) +
        "): " + JSON.stringify(result, null, 2)
    );

    t.assertEquals(200, result.status, result.status);
    t.assertTrue(typeof result.contentType === 'string', "Expected string contentType containing 'text/plain'");
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "Expected string contentType containing 'text/plain'");
    t.assertEquals("I am the content of /assets/asset-test-target.txt", ioMock.readText(result.body), "result.body");

    t.assertTrue(!!result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals('object', typeof result.headers, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals( "expectedEtag1234567890", result.headers.ETag, "result.headers should be an object with ETag and Cache-Control");
    t.assertTrue(result.headers.ETag.length > 0, "result.headers should be an object with ETag and Cache-Control");
    t.assertEquals(DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"], "result.headers should be an object with ETag and Cache-Control");


};

/*
exports.testGet_optionsPath = () => {
    const lib = require('./index');

    const result = lib.get({path: '/assets/asset-test-target.txt'});

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

exports.testGet_path_HTML_FullDefaultResponse = () => {
    const lib = require('./index');

    const result = lib.get('/static/static-test-html.html');

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

exports.testGet_path_Css = () => {
    const lib = require('./index');

    const result = lib.get('/static/static-test-css.css');

    t.assertTrue(!!result.contentType);
    t.assertTrue(result.contentType.indexOf("text/css") !== -1);
    t.assertEquals(".i.am.a.test.css {\n\n}\n", ioLib.readText(result.body));

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
};

exports.testGet_path_JS = () => {
    const lib = require('./index');

    const result = lib.get('/static/static-test-js.js');

    t.assertTrue(!!result.contentType);
    t.assertTrue(result.contentType.indexOf("application/javascript") !== -1);
    t.assertEquals("console.log(\"I am a test js\");\n", ioLib.readText(result.body));

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
};

exports.testGet_path_JSON = () => {
    const lib = require('./index');

    const result = lib.get('/static/static-test-json.json');

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

exports.testGet_path_XML = () => {
    const lib = require('./index');

    const result = lib.get('/static/static-test-xml.xml');

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

exports.testGet_path_Text = () => {
    const lib = require('./index');

    const result = lib.get('/static/static-test-text.txt');

    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
    t.assertEquals("I am a test text\n", ioLib.readText(result.body));

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
}

exports.testGet_path_JPG = () => {
    const lib = require('./index');

    const result = lib.get('/static/w3c_home.jpg');

    t.assertEquals(200, result.status);
    t.assertTrue(!!result.contentType);
    t.assertTrue(result.contentType.indexOf("image/jpeg") !== -1);

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
};

exports.testGet_path_GIF = () => {
    const lib = require('./index');

    const result = lib.get('/static/w3c_home.gif');

    t.assertEquals(200, result.status);
    t.assertTrue(!!result.contentType);
    t.assertTrue(result.contentType.indexOf("image/gif") !== -1);

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
};


// Path error handling

exports.testGet_fail_path_NotFound_should404 = () => {
    const lib = require('./index');

    const result = lib.get('/static/doesNotExist.txt');

    t.assertTrue(!!result.body);
    t.assertEquals(404, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated

    log.info(`OK: ${result.status} - ${result.body}`);
}

exports.testGet_fail_path_empty_should400 = () => {
    const lib = require('./index');

    const result = lib.get('');

    t.assertTrue(!!result.body);
    t.assertEquals(400, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated

    log.info(`OK: ${result.status} - ${result.body}`)
}

exports.testGet_fail_path_spaces_should400 = () => {
    const lib = require('./index');

    const result = lib.get('  ');

    t.assertTrue(!!result.body);
    t.assertEquals(400, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated

    log.info(`OK: ${result.status} - ${result.body}`)
}

exports.testGet_fail_path_slash_should400 = () => {
    const lib = require('./index');

    const result = lib.get('/');

    t.assertTrue(!!result.body);
    t.assertEquals(400, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated

    log.info(`OK: ${result.status} - ${result.body}`)
}

exports.testGet_fail_path_slashes_should400 = () => {
    const lib = require('./index');

    const result = lib.get('///');

    t.assertTrue(!!result.body);
    t.assertEquals(400, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated

    log.info(`OK: ${result.status} - ${result.body}`)
}

exports.testGet_fail_path_optionsArg_NotFound_should404 = () => {
    const lib = require('./index');

    const result = lib.get({path: '/static/doesNotExist.txt'});

    t.assertTrue(!!result.body);
    t.assertEquals(404, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated

    log.info(`OK: ${result.status} - ${result.body}`)
}

exports.testGet_fail_path_optionsArg_empty_should400 = () => {
    const lib = require('./index');

    const result = lib.get({path: ''});

    t.assertTrue(!!result.body);
    t.assertEquals(400, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated

    log.info(`OK: ${result.status} - ${result.body}`)
}

exports.testGet_fail_path_optionsArg_spaces_should400 = () => {
    const lib = require('./index');

    const result = lib.get({path: '  '});

    t.assertTrue(!!result.body);
    t.assertEquals(400, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated

    log.info(`OK: ${result.status} - ${result.body}`)
}

exports.testGet_fail_path_optionsArg_slash_should400 = () => {
    const lib = require('./index');

    const result = lib.get({path: '/'});

    t.assertTrue(!!result.body);
    t.assertEquals(400, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated

    log.info(`OK: ${result.status} - ${result.body}`)
}

exports.testGet_fail_path_optionsArg_slashes_should400 = () => {
    const lib = require('./index');

    const result = lib.get({path: '///'});

    t.assertTrue(!!result.body);
    t.assertEquals(400, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated

    log.info(`OK: ${result.status} - ${result.body}`)
}

exports.testGet_fail_optionParsingError_should500withMessage = () => {
    const lib = require('./index');

    const result = lib.get('/assets/asset-test-target.txt', {
        etag: 0
    });

    t.assertTrue(!!result.body);
    t.assertEquals(500, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated

    log.info(`OK: ${result.status} - ${result.body}`)
}
exports.testGet_fail_optionParsingError_should500withMessage = () => {
    const lib = require('./index');

    const result = lib.get();

    t.assertTrue(!!result.body);
    t.assertEquals(500, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated

    log.info(`OK: ${result.status} - ${result.body}`)
}
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

exports.testGet_fail_pathParsingError_should500withMessage = () => {
    const lib = require('./index');

    const result = lib.get(["this", "can't", "be", "good"]);

    t.assertTrue(!!result.body);
    t.assertEquals(500, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated

    log.info(`OK: ${result.status} - ${result.body}`);
}
exports.testGet_fail_pathParsingError_throwErrors = () => {
    const lib = require('./index');

    let result = null,
        failed = true;
    try {
        result = lib.get(["this", "can't", "be", "good"], {
            throwErrors: true
        });
        failed = false;
    } catch (e) {
        log.info("OK: " + e.message);
    }

    t.assertTrue(failed, "Should have failed. Instead, got a result: " + JSON.stringify(result));
}

exports.testGet_fail_contentTypeFunc_runtimeError_should500withMessage = () => {
    const lib = require('./index');

    const result = lib.get('/assets/asset-test-target.txt', {
        contentType: () => {
            throw Error("This will be thrown outside of parsePathAndFunctions. Should still be handled.");
        }
    });

    t.assertTrue(!!result.body);
    t.assertEquals(500, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated

    log.info(`OK: ${result.status} - ${result.body}`)
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

exports.testGet_fail_cacheControlFunc_runtimeError_should500withMessage = () => {
    const lib = require('./index');

    const result = lib.get('/assets/asset-test-target.txt', {
        cacheControl: () => {
            throw Error("This will be thrown outside of parsePathAndFunctions. Should still be handled.");
        }
    });

    t.assertTrue(!!result.body);
    t.assertEquals(500, result.status);
    t.assertTrue(typeof result.contentType === 'string');
    t.assertTrue(result.contentType.indexOf("text/plain") !== -1, "result.contentType should contain 'text/plain'");
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated

    log.info(`OK: ${result.status} - ${result.body}`)
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



exports.testGetPathError_valid_shouldReturnUndefined = () => {
    const lib = require('./index');

    t.assertEquals(undefined, lib.getPathError('hey'));
    t.assertEquals(undefined, lib.getPathError('æøå'));
    t.assertEquals(undefined, lib.getPathError('foo/bar'));
    t.assertEquals(undefined, lib.getPathError('/slash/start'));
    t.assertEquals(undefined, lib.getPathError('slash/end/'));
}

exports.testGetPathError_empty_shouldReturnNonEmptyErrorMessage = () => {
    const lib = require('./index');

    const errorMessage = lib.getPathError('');
    t.assertEquals('string', typeof errorMessage);
    t.assertNotEquals('', errorMessage.trim());

    log.info("OK: " + errorMessage);
}

exports.testGetPathError_allSpaces_shouldPassSinceStringShouldBeTrimmedFirst = () => {
    const lib = require('./index');

    const errorMessage = lib.getPathError('   ');
    t.assertEquals(undefined, errorMessage);
}

exports.testGetPathError_doubleDot_shouldReturnNonEmptyErrorMessage = () => {
    const lib = require('./index');

    const errorMessage = lib.getPathError('foo/../bar');
    t.assertEquals('string', typeof errorMessage);
    t.assertNotEquals('', errorMessage.trim());

    t.assertNotEquals('', lib.getPathError('../foo/bar').trim());
    t.assertNotEquals('', lib.getPathError('foo/bar/..').trim());

    log.info("OK: " + errorMessage);
}

exports.testGetPathError_asterisk_shouldReturnNonEmptyErrorMessage = () => {
    const lib = require('./index');

    const errorMessage = lib.getPathError('foo/*bar');
    t.assertEquals('string', typeof errorMessage);
    t.assertNotEquals('', errorMessage.trim());

    //t.assertNotEquals('', lib.getPathError('f*oo/bar').trim());
    //t.assertNotEquals('', lib.getPathError('foo/*.bar').trim());

    log.info("OK: " + errorMessage);
}

exports.testGetPathError_questionmark_shouldReturnNonEmptyErrorMessage = () => {
    const lib = require('./index');

    const errorMessage = lib.getPathError('foo/?bar');
    t.assertEquals('string', typeof errorMessage);
    t.assertNotEquals('', errorMessage.trim());

    t.assertNotEquals('', lib.getPathError('?/foo/bar').trim());
    t.assertNotEquals('', lib.getPathError('foo/?.bar').trim());

    log.info("OK: " + errorMessage);
}

exports.testGetPathError_backslash_shouldReturnNonEmptyErrorMessage = () => {
    const lib = require('./index');

    const errorMessage = lib.getPathError('foo/\\bar');
    t.assertEquals('string', typeof errorMessage);
    t.assertNotEquals('', errorMessage.trim());

    t.assertNotEquals('', lib.getPathError('\\/foo/bar').trim());
    t.assertNotEquals('', lib.getPathError('foo\\bar').trim());

    log.info("OK: " + errorMessage);
}

exports.testGetPathError_quote_shouldReturnNonEmptyErrorMessage = () => {
    const lib = require('./index');

    const errorMessage = lib.getPathError("foo/'bar");
    t.assertEquals('string', typeof errorMessage);
    t.assertNotEquals('', errorMessage.trim());

    t.assertNotEquals('', lib.getPathError("'foobar").trim());
    t.assertNotEquals('', lib.getPathError("foobar'").trim());
    t.assertNotEquals('', lib.getPathError("'foobar'").trim());

    log.info("OK: " + errorMessage);
}

exports.testGetPathError_doublequote_shouldReturnNonEmptyErrorMessage = () => {
    const lib = require('./index');

    const errorMessage = lib.getPathError('foo/"bar');
    t.assertEquals('string', typeof errorMessage);
    t.assertNotEquals('', errorMessage.trim());

    t.assertNotEquals('', lib.getPathError('"foobar').trim());
    t.assertNotEquals('', lib.getPathError('foobar"').trim());
    t.assertNotEquals('', lib.getPathError('"foobar"').trim());

    log.info("OK: " + errorMessage);
}

exports.testGetPathError_tick_shouldReturnNonEmptyErrorMessage = () => {
    const lib = require('./index');

    const errorMessage = lib.getPathError('foo´bar');
    t.assertEquals('string', typeof errorMessage);
    t.assertNotEquals('', errorMessage.trim());

    t.assertNotEquals('', lib.getPathError('´foobar').trim());
    t.assertNotEquals('', lib.getPathError('foobar´').trim());
    t.assertNotEquals('', lib.getPathError('´foobar´').trim());

    log.info("OK: " + errorMessage);
}

exports.testGetPathError_backtick_shouldReturnNonEmptyErrorMessage = () => {
    const lib = require('./index');

    const errorMessage = lib.getPathError('foo`bar');
    t.assertEquals('string', typeof errorMessage);
    t.assertNotEquals('', errorMessage.trim());

    t.assertNotEquals('', lib.getPathError('`foobar').trim());
    t.assertNotEquals('', lib.getPathError('foobar`').trim());
    t.assertNotEquals('', lib.getPathError('`foobar`').trim());

    log.info("OK: " + errorMessage);
}

exports.testGetPathError_lesserthan_shouldReturnNonEmptyErrorMessage = () => {
    const lib = require('./index');

    const errorMessage = lib.getPathError('foo<bar');
    t.assertEquals('string', typeof errorMessage);
    t.assertNotEquals('', errorMessage.trim());

    t.assertNotEquals('', lib.getPathError('<foobar').trim());
    t.assertNotEquals('', lib.getPathError('foobar<').trim());

    log.info("OK: " + errorMessage);
}

exports.testGetPathError_greaterthan_shouldReturnNonEmptyErrorMessage = () => {
    const lib = require('./index');

    const errorMessage = lib.getPathError('foo>bar');
    t.assertEquals('string', typeof errorMessage);
    t.assertNotEquals('', errorMessage.trim());

    t.assertNotEquals('', lib.getPathError('>foobar').trim());
    t.assertNotEquals('', lib.getPathError('foobar>').trim());

    log.info("OK: " + errorMessage);
}

exports.testGetPathError_colon_shouldReturnNonEmptyErrorMessage = () => {
    const lib = require('./index');

    const errorMessage = lib.getPathError('foo:bar');
    t.assertEquals('string', typeof errorMessage);
    t.assertNotEquals('', errorMessage.trim());

    t.assertNotEquals('', lib.getPathError(':foobar').trim());
    t.assertNotEquals('', lib.getPathError('foobar:').trim());

    log.info("OK: " + errorMessage);
}


//////////////////////////////////////////////////////////////////////  TEST .static


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
