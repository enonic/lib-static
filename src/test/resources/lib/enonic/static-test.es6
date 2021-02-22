const lib = require('/lib/enonic/static');
const t = require('/lib/xp/testing');

const taggingReader = require('./etaggingResourceReader');
const optionsParser = require('./options');

const overrideReaderResult = (params) => {
    const READER = '/lib/enonic/static/etaggingResourceReader.js';
    if (
        params.status &&
        params.body &&
        params.etagValue
    ) {
        t.mock(READER, {
            read: () => params
        });

    } else {
        t.mock(READER, {
            read: (path, etagOverride) => {
                const readout = taggingReader.read(path, etagOverride);
                return {
                    ...readout,
                    ...params
                }
            }
        });
    }
};

const overrideOptionsParserResult = (params) => {
    const PARSER = '/lib/enonic/static/options.js';
    if (
        params.path &&
        params.cacheControlFunc &&
        params.contentTypeFunc &&
        params.etagOverride &&
        params.throwErrors &&
        params.errorMessage
    ) {
        t.mock(PARSER, {
            read: () => params
        });

    } else {
        t.mock(PARSER, {
            read: (path, etagOverride) => {
                const readout = optionsParser.parsePathAndOptions(path, etagOverride);
                return {
                    ...readout,
                    ...params
                }
            }
        });
    }

}

//////////////////////////////////////////////////////////////////  TEST .get

// Path string argument

exports.testGet_path_Asset_FullDefaultResponse = () => {
    const result = lib.get('/assets/asset-test-target.txt');

    t.assertEquals("I am a test asset\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/plain", result.contentType);
};

exports.testGet_path_HTML_FullDefaultResponse = () => {
    const result = lib.get('/static/static-test-html.html');

    t.assertEquals("<html><body><p>I am a test HTML</p></body></html>\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/html", result.contentType);
};

exports.testGet_path_Css = () => {
    const result = lib.get('/static/static-test-css.css');

    t.assertEquals("text/css", result.contentType);
    t.assertEquals(".i.am.a.test.css {\n\n}\n", result.body);
};

exports.testGet_path_JS = () => {
    const result = lib.get('/static/static-test-js.js');

    t.assertEquals("application/javascript", result.contentType);
    t.assertEquals("console.log(\"I am a test js\");\n", result.body);
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
};

exports.testGet_path_XML = () => {
    const result = lib.get('/static/static-test-xml.xml');

    t.assertEquals("text/xml", result.contentType);
    t.assertEquals(`<I>
    <am>a</am>
    <test>xml</test>
</I>
`, result.body);
}

exports.testGet_path_Text = () => {
    const result = lib.get('/static/static-test-text.txt');

    t.assertEquals("text/plain", result.contentType);
    t.assertEquals("I am a test text\n", result.body);
}

exports.testGet_path_JPG = () => {
    const result = lib.get('/static/w3c_home.jpg');

    t.assertEquals(200, result.status);
    t.assertEquals("image/jpeg", result.contentType);
};

exports.testGet_path_GIF = () => {
    const result = lib.get('/static/w3c_home.gif');

    t.assertEquals(200, result.status);
    t.assertEquals("image/gif", result.contentType);
};

// Path error handling

exports.testGet_fail_path_NotFound_should404_Thorough = () => {
    const result = lib.get('/static/doesNotExist.txt');

    t.assertTrue(!!result.body);
    t.assertEquals(404, result.status);
    t.assertEquals("text/plain", result.contentType);
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated

    // log.info("testGet_fail_path_NotFound_should404 is OK. result.body = " + result.body);
}

exports.testGet_fail_path_EmptyString_should500_Thorough = () => {
    const result = lib.get('');

    t.assertTrue(!!result.body);
    t.assertEquals(500, result.status);
    t.assertEquals("text/plain", result.contentType);
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated

    // log.info("testGet_fail_path_EmptyString_should500 is OK. result.body = " + result.body);
}

exports.testGet_fail_path_Spaces_should500 = () => {
    const result = lib.get('  ');

    t.assertEquals(500, result.status);
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated

    // log.info("testGet_fail_path_Spaces_should500 is OK. result.body = " + result.body);
}

exports.testGet_fail_path_Missing_should500 = () => {
    const result = lib.get();

    t.assertEquals(500, result.status);
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated

    // log.info("testGet_fail_path_Missing_should500 is OK. result.body = " + result.body);
}


exports.testGet_fail_path_Undef_should500 = () => {
    const result = lib.get(undefined);

    t.assertEquals(500, result.status);
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated

    // log.info("testGet_fail_path_Undef_should500 is OK. result.body = " + result.body);
}

exports.testGet_fail_path_Null_should500 = () => {
    const result = lib.get(null);

    t.assertEquals(500, result.status);
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated

    // log.info("testGet_fail_path_Null_should500 is OK. result.body = " + result.body);
}

exports.testGet_fail_path_WrongTypeNumber_should500 = () => {
    const result = lib.get(5);

    // log.info("testGet_fail_path_WrongTypeNumber_should500 is OK. result.body = " + result.body);

    t.assertEquals(500, result.status);
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
}

exports.testGet_fail_path_WrongTypeZero_should500 = () => {
    const result = lib.get(0);

    // log.info("testGet_fail_path_WrongTypeNumber_should500 is OK. result.body = " + result.body);

    t.assertEquals(500, result.status);
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
}

exports.testGet_fail_path_WrongTypeContentArray_should500 = () => {
    const result = lib.get(["hey", "ho"]);

    // log.info("testGet_fail_path_Array_should500 is OK. result.body = " + result.body);

    t.assertEquals(500, result.status);
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
}

exports.testGet_fail_path_WrongTypeEmptyArray_should500 = () => {
    const result = lib.get([]);

    // log.info("testGet_fail_path_EmptyArray_should500 is OK. result.body = " + result.body);

    t.assertEquals(500, result.status);
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
}







// Path in options object argument

exports.testGet_objPath_Asset = () => {
    const result = lib.get({path: '/assets/asset-test-target.txt'});

    t.assertEquals("I am a test asset\n", result.body);
    t.assertEquals("text/plain", result.contentType);
};

exports.testGet_objPath_HTML = () => {
    const result = lib.get({path: '/static/static-test-html.html'});

    t.assertEquals("<html><body><p>I am a test HTML</p></body></html>\n", result.body);
    t.assertEquals("text/html", result.contentType);
};

exports.testGet_objPath_Css_Thorough = () => {
    const result = lib.get({path: '/static/static-test-css.css'});

    t.assertEquals(".i.am.a.test.css {\n\n}\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/css", result.contentType);
    };

exports.testGet_objPath_JS_Thorough = () => {
    const result = lib.get({path: '/static/static-test-js.js'});

    t.assertEquals("console.log(\"I am a test js\");\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("application/javascript", result.contentType);
    };

exports.testGet_objPath_JSON = () => {
    const result = lib.get({path: '/static/static-test-json.json'});

    t.assertEquals("application/json", result.contentType);
    t.assertEquals(`{
  "I": {
    "am": "a",
    "test": "json"
  }
}
`, result.body);
};

exports.testGet_objPath_XML = () => {
    const result = lib.get({path: '/static/static-test-xml.xml'});

    t.assertEquals("text/xml", result.contentType);
    t.assertEquals(`<I>
    <am>a</am>
    <test>xml</test>
</I>
`, result.body);
}

exports.testGet_objPath_Text = () => {
    const result = lib.get({path: '/static/static-test-text.txt'});

    t.assertEquals("text/plain", result.contentType);
    t.assertEquals("I am a test text\n", result.body);
}

exports.testGet_objPath_JPG = () => {
    const result = lib.get({path: '/static/w3c_home.jpg'});

    t.assertEquals(200, result.status);
    t.assertEquals("image/jpeg", result.contentType);
};

exports.testGet_objPath_GIF = () => {
    const result = lib.get({path: '/static/w3c_home.gif'});

    t.assertEquals(200, result.status);
    t.assertEquals("image/gif", result.contentType);
};

// Error handling

exports.testGet_fail_objPath_NotFound_should404_thorough = () => {
    const result = lib.get({path: '/static/doesNotExist.txt'});

    t.assertEquals(!!result.body, true);
    t.assertEquals(404, result.status);
    t.assertEquals("text/plain", result.contentType);
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated

    // log.info("testGet_fail_objPath_NotFound_should404 is OK. result.body = " + result.body);
}

exports.testGet_fail_objPath_EmptyString_should500 = () => {
    const result = lib.get({path: ''});

    t.assertEquals(500, result.status);
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated

    // log.info("testGet_fail_objPath_EmptyString_should500 is OK. result.body = " + result.body);
}

exports.testGet_fail_objPath_Spaces_should500 = () => {
    const result = lib.get({path: '  '});

    t.assertEquals(500, result.status);
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated

    // log.info("testGet_fail_objPath_Spaces_should500 is OK. result.body = " + result.body);
}

exports.testGet_fail_objPath_Missing_should500_thorough = () => {
    const result = lib.get({});

    t.assertTrue(!!result.body);
    t.assertEquals(500, result.status);
    t.assertEquals("text/plain", result.contentType);
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated

    // log.info("testGet_fail_objPath_Missing_should500 is OK. result.body = " + result.body);
}

exports.testGet_fail_objPath_WrongTypeNumber_should500 = () => {
    const result = lib.get({path: 5});

    t.assertEquals(500, result.status);
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated

    // log.info("testGet_fail_objPath_WrongType_should500 is OK. result.body = " + result.body);
}

exports.testGet_fail_objPath_WrongTypeZero_should500 = () => {
    const result = lib.get({path: 0});

    t.assertEquals(500, result.status);
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated

    // log.info("testGet_fail_objPath_WrongType_should500 is OK. result.body = " + result.body);
}

exports.testGet_fail_objPath_WrongTypeEmptyArray_should500 = () => {
    const result = lib.get({path: []});

    t.assertEquals(500, result.status);
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated

    // log.info("testGet_fail_objPath_WrongType_should500 is OK. result.body = " + result.body);
}

exports.testGet_fail_objPath_WrongTypeContentArray_should500 = () => {
    const result = lib.get({path: ["hey", "ho", "lets", "go"]});

    t.assertEquals(500, result.status);
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated

    // log.info("testGet_fail_objPath_WrongType_should500 is OK. result.body = " + result.body);
}







// Test options object

exports.testGet_options_Undef_thorough = () => {
    // Tolerated and ignored, since obviously falsy/empty
    const result = lib.get('/assets/asset-test-target.txt', undefined);

    t.assertEquals("I am a test asset\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/plain", result.contentType);
    };

exports.testGet_options_Null = () => {
    // Tolerated and ignored, since obviously falsy/empty
    const result = lib.get('/assets/asset-test-target.txt', null);

    t.assertEquals("I am a test asset\n", result.body);
    t.assertEquals(200, result.status);
};

exports.testGet_options_EmptyString = () => {
    // Tolerated and ignored, since obviously falsy/empty
    const result = lib.get('/assets/asset-test-target.txt', "");

    t.assertEquals("I am a test asset\n", result.body);
    t.assertEquals(200, result.status);
};

exports.testGet_options_EmptyObject_thorough = () => {
    // Tolerated and ignored, since obviously empty
    const result = lib.get('/assets/asset-test-target.txt', {});

    t.assertEquals("I am a test asset\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/plain", result.contentType);
    };

exports.testGet_options_Zero = () => {
    // Tolerated and ignored, since obviously empty/falsy
    const result = lib.get('/assets/asset-test-target.txt', 0);

    t.assertEquals("I am a test asset\n", result.body);
    t.assertEquals(200, result.status);
};

// Error handling

exports.testGet_fail_options_EmptyArray_should500 = () => {
    const result = lib.get('/assets/asset-test-target.txt', []);

    t.assertTrue(!!result.body);
    t.assertEquals(500, result.status);
};

exports.testGet_fail_options_ContentArray_should500_thorough = () => {
    const result = lib.get('/assets/asset-test-target.txt', ["I'm", "mister", "object", "look", "at", "meeee"]);

    t.assertTrue(!!result.body);
    t.assertEquals(500, result.status);
    t.assertEquals("text/plain", result.contentType);
    t.assertTrue(!(result.headers || {})['Cache-Control']); // No cache-control header should be generated
};

exports.testGet_fail_options_ContentString_should500 = () => {
    const result = lib.get('/assets/asset-test-target.txt', "Whatever");

    t.assertTrue(!!result.body);
    t.assertEquals(500, result.status);
};

exports.testGet_fail_options_Number_should500 = () => {
    const result = lib.get('/assets/asset-test-target.txt', 5);

    t.assertTrue(!!result.body);
    t.assertEquals(500, result.status);
};





// Test option: cacheControl overrides (default behavior is `Cache-Control:`

exports.testGet_option_cacheControl_False_thorough = () => {
    let result = lib.get('/assets/asset-test-target.txt', {cacheControl: false});

    t.assertEquals("I am a test asset\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/plain", result.contentType);
    t.assertTrue(!result.headers['Cache-Control']);

    result = lib.get({path: '/static/static-test-html.html', cacheControl: false});

    t.assertEquals("<html><body><p>I am a test HTML</p></body></html>\n", result.body);
    t.assertEquals(200, result.status);
    t.assertTrue(!result.headers['Cache-Control']);
};

exports.testGet_option_cacheControl_EmptyString = () => {
    let result = lib.get('/assets/asset-test-target.txt', {cacheControl: ""});

    t.assertEquals(200, result.status);
    t.assertTrue(!result.headers['Cache-Control']);

    result = lib.get({path: '/static/static-test-html.html', cacheControl: ""});

    t.assertEquals(200, result.status);
    t.assertTrue(!result.headers['Cache-Control']);
};

exports.testGet_option_cacheControl_String_thorough = () => {
    let result = lib.get('/assets/asset-test-target.txt', {cacheControl: "some custom string"});

    t.assertEquals("I am a test asset\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/plain", result.contentType);
    t.assertEquals("some custom string", result.headers['Cache-Control']);

    result = lib.get({path: '/static/static-test-html.html', cacheControl: "some other custom string"});

    t.assertEquals("<html><body><p>I am a test HTML</p></body></html>\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("some other custom string", result.headers['Cache-Control']);
};

exports.testGet_option_cacheControl_FunctionByPath = () => {
    const pathFunction = (path, conten, mimeTypet) => {
        if (path.endsWith('.jpg')) {
            return "CacheControl header for JPEG";
        }
        if (path.endsWith('.html')) {
            return "Expected cacheControl header for HTML";
        }
        if (path.endsWith('.txt')) {
            return "Expected cacheControl header for text";
        }
    };

    let htmlResult = lib.get('/static/static-test-html.html', {cacheControl: pathFunction});
    let textResult = lib.get({path: '/assets/asset-test-target.txt', cacheControl: pathFunction});

    t.assertEquals(200, htmlResult.status);
    t.assertEquals("Expected cacheControl header for HTML", htmlResult.headers['Cache-Control']);
    t.assertEquals(200, textResult.status);
    t.assertEquals("Expected cacheControl header for text", textResult.headers['Cache-Control']);
};

exports.testGet_option_cacheControl_FunctionByContent = () => {
    const contentFunction = (path, content, mimeType) => {
        if (content.match(/test\s*asset/gi)) {
            return "Expected header for any file that contains 'test asset'";
        } else {
            return "Expected header for any file that doesn't"
        }
    };

    let textResult = lib.get('/assets/asset-test-target.txt', { cacheControl: contentFunction});
    let htmlResult = lib.get({path: '/static/static-test-html.html', cacheControl: contentFunction});

    t.assertEquals("I am a test asset\n", textResult.body);
    t.assertEquals("Expected header for any file that contains 'test asset'", textResult.headers['Cache-Control']);
    t.assertEquals(200, htmlResult.status);
    t.assertEquals("Expected header for any file that doesn't", htmlResult.headers['Cache-Control']);
};



exports.testGet_option_cacheControl_FunctionByMIMEType = () => {
    const mimeFunction = (path, conten, mimeType) => {
        if (mimeType === 'image/jpeg') {
            return "CacheControl header for JPEG";
        }
        if (mimeType === 'text/html') {
            return "Expected cacheControl header for HTML";
        }
        if (mimeType === 'text/plain') {
            return "Expected cacheControl header for text";
        }
    };

    let htmlResult = lib.get('/static/static-test-html.html', {cacheControl: mimeFunction});
    let textResult = lib.get({path: '/assets/asset-test-target.txt', cacheControl: mimeFunction});

    t.assertEquals(200, htmlResult.status);
    t.assertEquals("Expected cacheControl header for HTML", htmlResult.headers['Cache-Control']);
    t.assertEquals(200, textResult.status);
    t.assertEquals("Expected cacheControl header for text", textResult.headers['Cache-Control']);
};

exports.testGet_option_cacheControl_FunctionFallback = () => {
    const contentFunction = (path, content, mimeType) => {
        if (path.endsWith('.txt')) {
            return "Expected header for .txt file";
        } else {
            return null
        }
    };

    let textResult = lib.get({path: '/assets/asset-test-target.txt', cacheControl: contentFunction});
    let htmlResult = lib.get('/static/static-test-html.html', {cacheControl: contentFunction});

    t.assertEquals(200, textResult.status);
    t.assertEquals("Expected header for .txt file", textResult.headers['Cache-Control']);
    t.assertEquals(200, htmlResult.status);
};


exports.testGet_fail_option_cacheControl_WrongTypes = () => {
    // Zero
    let result = lib.get('/static/static-test-html.html', {cacheControl: 0});
    t.assertEquals(500, result.status, "Should have failed #1. result = " + JSON.stringify(result));

    // Number
    result = lib.get('/static/static-test-html.html', {cacheControl: 42});
    t.assertEquals(500, result.status, "Should have failed #2. result = " + JSON.stringify(result));

    // Empty array
    result = lib.get('/static/static-test-html.html', {cacheControl: []});
    t.assertEquals(500, result.status, "Should have failed #3. result = " + JSON.stringify(result));

    // Array
    result = lib.get('/static/static-test-html.html', {cacheControl: ["I'm", "kind", "of", "an", "object"]});
    t.assertEquals(500, result.status, "Should have failed #4. result = " + JSON.stringify(result));

    // Empty object
    result = lib.get('/static/static-test-html.html', {cacheControl: {}});
    t.assertEquals(500, result.status, "Should have failed #5. result = " + JSON.stringify(result));

    // Object
    result = lib.get('/static/static-test-html.html', {cacheControl: {i: "am", an: "object"}});
    t.assertEquals(500, result.status, "Should have failed #6. result = " + JSON.stringify(result));
}




// Test option: etag

exports.testGet_option_etag_unsetProd = () => {

}



// Test option: throwErrors

exports.testGet_fail_option_throwError_WrongPathType = () => {
    let result = "Unchanged";
    let completed = false;
    try {
        result = lib.get(5, {throwErrors: true});
        completed = true;
    } catch (e) {
        // log.info("testGet_fail_path_WrongTypeThrowError thrown OK. Error message = " + e.message);
    }
    t.assertEquals(result, "Unchanged");
    t.assertEquals(completed, false);
}

exports.testGet_fail_option_throwError_WrongObjPathType = () => {
    let result = "Unchanged";
    let completed = false;
    try {
        result = lib.get({path: 5, throwErrors: true});
        completed = true;
    } catch (e) {
        // log.info("testGet_fail_objPath_WrongTypeThrowError thrown OK. Error message = " + e.message);
    }
    t.assertEquals(result, "Unchanged");
    t.assertEquals(completed, false);
}






