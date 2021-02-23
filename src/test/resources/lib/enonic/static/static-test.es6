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
