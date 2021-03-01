const lib = require('./index');
const t = require('/lib/xp/testing');

const optionsParser = require('/lib/enonic/static/options');



//////////////////////////////////////////////////////////////////  TEST .get

// Path string argument

exports.testGet_path_Asset_FullDefaultResponse = () => {
    const result = lib.get('/assets/asset-test-target.txt');

    t.assertEquals("I am a test asset\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/plain", result.contentType);

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);

    log.info(".get: full get response readout (" +
    	(typeof result + (result && typeof result === 'object' ? (" with keys: " + JSON.stringify(Object.keys(result))) : "")
    	) + "): " + JSON.stringify(result, null, 2)
    );
};

exports.testGet_optionsPath = () => {
    const result = lib.get({path: '/assets/asset-test-target.txt'});

    t.assertEquals("I am a test asset\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/plain", result.contentType);

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
};

exports.testGet_path_HTML_FullDefaultResponse = () => {
    const result = lib.get('/static/static-test-html.html');

    t.assertEquals("<html><body><p>I am a test HTML</p></body></html>\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/html", result.contentType);

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
};

exports.testGet_path_Css = () => {
    const result = lib.get('/static/static-test-css.css');

    t.assertEquals("text/css", result.contentType);
    t.assertEquals(".i.am.a.test.css {\n\n}\n", result.body);

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
};

exports.testGet_path_JS = () => {
    const result = lib.get('/static/static-test-js.js');

    t.assertEquals("application/javascript", result.contentType);
    t.assertEquals("console.log(\"I am a test js\");\n", result.body);

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
};

exports.testGet_path_JSON = () => {
    const result = lib.get('/static/static-test-json.json');

    t.assertEquals("application/json", result.contentType);
    t.assertEquals(`{
  "I": {
    "am": "a",
    "test": "json"
  }
}
`, result.body);

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
};

exports.testGet_path_XML = () => {
    const result = lib.get('/static/static-test-xml.xml');

    t.assertEquals("text/xml", result.contentType);
    t.assertEquals(`<I>
    <am>a</am>
    <test>xml</test>
</I>
`, result.body);

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
}

exports.testGet_path_Text = () => {
    const result = lib.get('/static/static-test-text.txt');

    t.assertEquals("text/plain", result.contentType);
    t.assertEquals("I am a test text\n", result.body);

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
}

exports.testGet_path_JPG = () => {
    const result = lib.get('/static/w3c_home.jpg');

    t.assertEquals(200, result.status);
    t.assertEquals("image/jpeg", result.contentType);

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
};

exports.testGet_path_GIF = () => {
    const result = lib.get('/static/w3c_home.gif');

    t.assertEquals(200, result.status);
    t.assertEquals("image/gif", result.contentType);

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
};



// Path error handling

exports.testGet_fail_path_NotFound_should404 = () => {
    const result = lib.get('/static/doesNotExist.txt');

    t.assertTrue(!!result.body);
    t.assertEquals(404, result.status);
    t.assertEquals("text/plain", result.contentType);
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated

    // log.info("testGet_fail_path_NotFound_should404 is OK. result.body = " + result.body);
}

exports.testGet_fail_optionParsingError_should500withMessage = () => {
    const result = lib.get('/assets/asset-test-target.txt', {
        etag: 0
    });

    t.assertTrue(!!result.body);
    t.assertEquals(500, result.status);
    t.assertEquals("text/plain", result.contentType);
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated
}
exports.testGet_fail_optionParsingError_throwErrors = () => {
    let result = null,
        failed = true;
    try {
        result = lib.get('/assets/asset-test-target.txt', {
            etag: 0,
            throwErrors: true
        });
        failed = false;
    } catch (e) {
        log.info("Thrown error: " + e.message);
    }

    t.assertTrue(failed, "Should have failed. Instead, got a result: " + JSON.stringify(result));
}

exports.testGet_fail_pathParsingError_should500withMessage = () => {
    const result = lib.get(["this", "can't", "be", "good"]);

    t.assertTrue(!!result.body);
    t.assertEquals(500, result.status);
    t.assertEquals("text/plain", result.contentType);
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated
}
exports.testGet_fail_pathParsingError_throwErrors = () => {
    let result = null,
        failed = true;
    try {
        result = lib.get(["this", "can't", "be", "good"], {
            throwErrors: true
        });
        failed = false;
    } catch (e) {
        log.info("Thrown error: " + e.message);
    }

    t.assertTrue(failed, "Should have failed. Instead, got a result: " + JSON.stringify(result));
}

exports.testGet_fail_contentTypeFunc_runtimeError_should500withMessage = () => {
    const result = lib.get('/assets/asset-test-target.txt', {
        contentType: () => {
            throw Error("This will be thrown outside of parsePathAndFunctions. Should still be handled.");
        }
    });

    t.assertTrue(!!result.body);
    t.assertEquals(500, result.status);
    t.assertEquals("text/plain", result.contentType);
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated
}
exports.testGet_fail_contentTypeFunc_runtimeError_throwErrors = () => {
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
        log.info("Thrown error: " + e.message);
    }

    t.assertTrue(failed, "Should have failed. Instead, got a result: " + JSON.stringify(result));
}

exports.testGet_fail_cacheControlFunc_runtimeError_should500withMessage = () => {
    const result = lib.get('/assets/asset-test-target.txt', {
        cacheControl: () => {
            throw Error("This will be thrown outside of parsePathAndFunctions. Should still be handled.");
        }
    });

    t.assertTrue(!!result.body);
    t.assertEquals(500, result.status);
    t.assertEquals("text/plain", result.contentType);
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated
}
exports.testGet_fail_cacheControlFunc_runtimeError_throwErrors = () => {
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
        log.info("Thrown error: " + e.message);
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


















//////////////////////////////////////////////////////////////////////  TEST .static


exports.testStatic_root_Asset_FullDefaultResponse = () => {
    const getStatic = lib.static('assets');            // Root folder: '/assets/'

    // Simulate an XP GET request from frontend
    const request = {
        path: 'my/endpoint/asset-test-target.txt',              // This path, in context of contextPath, yields the relative path 'asset-test-target.txt',
        contextPath: 'my/endpoint'                              // which together with the root folder 'assets' becomes the full asset path: 'assets/asset-test-target.txt'
    };

    const result = getStatic(request);

    t.assertEquals("I am a test asset\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/plain", result.contentType);

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);

    log.info(".static: full get response readout (" +
        (typeof result + (result && typeof result === 'object' ? (" with keys: " + JSON.stringify(Object.keys(result))) : "")
        ) + "): " + JSON.stringify(result, null, 2)
    );
};



exports.testStatic_optionsRoot = () => {
    const getStatic = lib.static({root: 'assets'});            // Root folder: '/assets/'

    // Simulate an XP GET request from frontend
    const request = {
        path: 'my/endpoint/asset-test-target.txt',              // This path, in context of contextPath, yields the relative path 'asset-test-target.txt',
        contextPath: 'my/endpoint'                              // which together with the root folder 'assets' becomes the full asset path: 'assets/asset-test-target.txt'
    };

    const result = getStatic(request);

    t.assertEquals("I am a test asset\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/plain", result.contentType);

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
};

exports.testStatic_ifNoneMatch_matchingEtagValues_should304 = () => {
    const getStatic = lib.static('assets');

    const request = {
        path: 'my/endpoint/asset-test-target.txt',
        contextPath: 'my/endpoint',
        headers: {
            'If-None-Match': 'djsptplmcdcidp39wx6ydiwn3'        // <-- TODO: Copied from output. Should mock instead.
        }
    };

    const result = getStatic(request);

    t.assertEquals(304, result.status);
};


exports.testStatic_ifNoneMatch_nonMatchingEtagValues_should200WithUpdatedContentAndEtag = () => {
    const getStatic = lib.static('assets');

    const request = {
        path: 'my/endpoint/asset-test-target.txt',
        contextPath: 'my/endpoint',
        headers: {
            'If-None-Match': 'oldEtagValue87654321'
        }
    };

    const result = getStatic(request);

    t.assertEquals("I am a test asset\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/plain", result.contentType);

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
    t.assertTrue(!!(result.headers || {}).ETag); // An ETag header should be generated
    t.assertNotEquals("oldEtagValue87654321", (result.headers || {}).ETag); // a NEW ETag header should be generated
};

exports.testStatic_option_arg2_contextPathOverride = () => {
    const getStatic = lib.static('assets', {contextPathOverride: 'my/endpoint'});

    // Simulate an XP GET request from a frontend that's NOT a prefix that leaves a relative asset path:
    const request = {
        path: 'my/endpoint/asset-test-target.txt',              // This path, in context of contextPathOVERRIDE ABOVE, yields the relative path 'asset-test-target.txt',
        contextPath: 'a/different/endpoint'                     // which together with the root folder 'assets' becomes the full asset path: 'assets/asset-test-target.txt'
    };

    const result = getStatic(request);

    t.assertEquals("I am a test asset\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/plain", result.contentType);
};

exports.testStatic_option_arg1_contextPathOverride = () => {
    const getStatic = lib.static({root: 'assets', contextPathOverride: 'my/endpoint'});

    // Simulate an XP GET request from a frontend that's NOT a prefix that leaves a relative asset path:
    const request = {
        path: 'my/endpoint/asset-test-target.txt',              // This path, in context of contextPathOVERRIDE ABOVE, yields the relative path 'asset-test-target.txt',
        contextPath: 'a/different/endpoint'                     // which together with the root folder 'assets' becomes the full asset path: 'assets/asset-test-target.txt'
    };

    const result = getStatic(request);

    t.assertEquals("I am a test asset\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/plain", result.contentType);
};



exports.testStatic_HTML_FullDefaultResponse = () => {

    const getStatic = lib.static('static');
    const request = {
        path: 'my/endpoint/static-test-html.html',
        contextPath: 'my/endpoint'
    };                                                  // --> /static/static-test-html.html

    const result = getStatic(request);

    t.assertEquals("<html><body><p>I am a test HTML</p></body></html>\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/html", result.contentType);

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
};

exports.testStatic_Css = () => {
    const getStatic = lib.static('static');
    const request = {
        path: 'my/endpoint/static-test-css.css',
        contextPath: 'my/endpoint'
    };                                                  // --> /static/static-test-css.css

    const result = getStatic(request);

    t.assertEquals("text/css", result.contentType);
    t.assertEquals(".i.am.a.test.css {\n\n}\n", result.body);

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
};

exports.testStatic_JS = () => {
    const getStatic = lib.static('static');
    const request = {
        path: 'my/endpoint/static-test-js.js',
        contextPath: 'my/endpoint'
    };                                                  // --> /static/static-test-js.js

    const result = getStatic(request);


    t.assertEquals("application/javascript", result.contentType);
    t.assertEquals("console.log(\"I am a test js\");\n", result.body);

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
};

exports.testStatic_JSON = () => {
    const getStatic = lib.static('static');
    const request = {
        path: 'my/endpoint/static-test-json.json',
        contextPath: 'my/endpoint'
    };                                                  // --> /static/static-test-json.json

    const result = getStatic(request);

    t.assertEquals("application/json", result.contentType);
    t.assertEquals(`{
  "I": {
    "am": "a",
    "test": "json"
  }
}
`, result.body);

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
};

exports.testStatic_XML = () => {
    const getStatic = lib.static('static');
    const request = {
        path: 'my/endpoint/static-test-xml.xml',
        contextPath: 'my/endpoint'
    };                                                  // --> /static/static-test-xml.xml

    const result = getStatic(request);

    t.assertEquals("text/xml", result.contentType);
    t.assertEquals(`<I>
    <am>a</am>
    <test>xml</test>
</I>
`, result.body);

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
}

exports.testStatic_Text = () => {
    const getStatic = lib.static('static');
    const request = {
        path: 'my/endpoint/static-test-text.txt',
        contextPath: 'my/endpoint'
    };                                                  // --> /static/static-test-text.txt

    const result = getStatic(request);

    t.assertEquals("text/plain", result.contentType);
    t.assertEquals("I am a test text\n", result.body);

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
}

exports.testStatic_JPG = () => {
    const getStatic = lib.static('static');
    const request = {
        path: 'my/endpoint/w3c_home.jpg',
        contextPath: 'my/endpoint'
    };                                                  // --> /static/w3c_home.jpg

    const result = getStatic(request);

    t.assertEquals(200, result.status);
    t.assertEquals("image/jpeg", result.contentType);

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
};

exports.testStatic_GIF = () => {
    const getStatic = lib.static('static');
    const request = {
        path: 'my/endpoint/w3c_home.gif',
        contextPath: 'my/endpoint'
    };                                                  // --> /static/w3c_home.gif

    const result = getStatic(request);

    t.assertEquals(200, result.status);
    t.assertEquals("image/gif", result.contentType);

    t.assertTrue(!!result.headers);
    t.assertEquals('object', typeof result.headers);
    t.assertEquals('string', typeof result.headers.ETag);
    t.assertTrue(result.headers.ETag.length > 0);
    t.assertEquals(optionsParser.DEFAULT_CACHE_CONTROL, result.headers["Cache-Control"]);
};

exports.testStatic_fail_invalidRoot = () => {
    const getStatic = lib.static('doesNotExist');
}


// Path error handling
/*
exports.testStatic_fail_NotFound_should404 = () => {
    const static = lib.static('static');
    const request = {
        path: 'my/endpoint/doesNotExist.txt',
        contextPath: 'my/endpoint'
    };                                                  // --> /static/w3c_home.gif

    const result = static(request);

    t.assertTrue(!!result.body);
    t.assertEquals(404, result.status);
    t.assertEquals("text/plain", result.contentType);
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated

    // log.info("testStatic_fail_path_NotFound_should404 is OK. result.body = " + result.body);
}

exports.testStatic_fail_optionParsingError_should500withMessage = () => {
    const result = lib.get('/assets/asset-test-target.txt', {
        etag: 0
    });

    t.assertTrue(!!result.body);
    t.assertEquals(500, result.status);
    t.assertEquals("text/plain", result.contentType);
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated
}
exports.testStatic_fail_optionParsingError_throwErrors = () => {
    let result = null,
        failed = true;
    try {
        result = lib.get('/assets/asset-test-target.txt', {
            etag: 0,
            throwErrors: true
        });
        failed = false;
    } catch (e) {
        log.info("Thrown error: " + e.message);
    }

    t.assertTrue(failed, "Should have failed. Instead, got a result: " + JSON.stringify(result));
}

exports.testStatic_fail_pathParsingError_should500withMessage = () => {
    const result = lib.get(["this", "can't", "be", "good"]);

    t.assertTrue(!!result.body);
    t.assertEquals(500, result.status);
    t.assertEquals("text/plain", result.contentType);
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated
}
exports.testStatic_fail_pathParsingError_throwErrors = () => {
    let result = null,
        failed = true;
    try {
        result = lib.get(["this", "can't", "be", "good"], {
            throwErrors: true
        });
        failed = false;
    } catch (e) {
        log.info("Thrown error: " + e.message);
    }

    t.assertTrue(failed, "Should have failed. Instead, got a result: " + JSON.stringify(result));
}

exports.testStatic_fail_contentTypeFunc_runtimeError_should500withMessage = () => {
    const result = lib.get('/assets/asset-test-target.txt', {
        contentType: () => {
            throw Error("This will be thrown outside of parsePathAndFunctions. Should still be handled.");
        }
    });

    t.assertTrue(!!result.body);
    t.assertEquals(500, result.status);
    t.assertEquals("text/plain", result.contentType);
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated
}
exports.testStatic_fail_contentTypeFunc_runtimeError_throwErrors = () => {
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
        log.info("Thrown error: " + e.message);
    }

    t.assertTrue(failed, "Should have failed. Instead, got a result: " + JSON.stringify(result));
}

exports.testStatic_fail_cacheControlFunc_runtimeError_should500withMessage = () => {
    const result = lib.get('/assets/asset-test-target.txt', {
        cacheControl: () => {
            throw Error("This will be thrown outside of parsePathAndFunctions. Should still be handled.");
        }
    });

    t.assertTrue(!!result.body);
    t.assertEquals(500, result.status);
    t.assertEquals("text/plain", result.contentType);
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
    t.assertTrue(!(result.headers || {}).ETag); // No ETag header should be generated
}
exports.testStatic_fail_cacheControlFunc_runtimeError_throwErrors = () => {
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
        log.info("Thrown error: " + e.message);
    }

    t.assertTrue(failed, "Should have failed. Instead, got a result: " + JSON.stringify(result));
}
//*/
