const lib = require('./static');
const t = require('/lib/xp/testing');


//////////////////////////////////////////////////////////////////  TEST .get

// Path string argument

exports.testGet_path_Asset = () => {
    const result = lib.get('/assets/asset-test-target.txt');

    t.assertEquals("I am a test asset\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/plain", result.contentType);
};

exports.testGet_path_HTML = () => {
    const result = lib.get('/static/static-test-html.html');

    t.assertEquals("<html><body><p>I am a test HTML</p></body></html>\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/html", result.contentType);
};

exports.testGet_path_Css = () => {
    const result = lib.get('/static/static-test-css.css');

    t.assertEquals(".i.am.a.test.css {\n\n}\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/css", result.contentType);
};

exports.testGet_path_JS = () => {
    const result = lib.get('/static/static-test-js.js');

    t.assertEquals("console.log(\"I am a test js\");\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("application/javascript", result.contentType);
};

exports.testGet_path_JSON = () => {
    const result = lib.get('/static/static-test-json.json');

    t.assertEquals(`{
  "I": {
    "am": "a",
    "test": "json"
  }
}
`, result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("application/json", result.contentType);
};

exports.testGet_path_XML = () => {
    const result = lib.get('/static/static-test-xml.xml');

    t.assertEquals(`<I>
    <am>a</am>
    <test>xml</test>
</I>
`, result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/xml", result.contentType);
}

exports.testGet_path_Text = () => {
    const result = lib.get('/static/static-test-text.txt');

    t.assertEquals("I am a test text\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/plain", result.contentType);
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

exports.testGet_fail_path_NotFound404 = () => {
    const result = lib.get('/static/doesNotExist.txt');

    t.assertEquals(!!result.body, true);
    t.assertEquals(404, result.status);
    t.assertEquals("text/plain", result.contentType);
    // log.info("testGet_fail_path_NotFound404 is OK. result.body = " + result.body);
}

exports.testGet_fail_path_EmptyString500 = () => {
    const result = lib.get('');

    t.assertEquals(!!result.body, true);
    t.assertEquals(500, result.status);
    t.assertEquals("text/plain", result.contentType);
    // log.info("testGet_fail_path_EmptyString500 is OK. result.body = " + result.body);
}

exports.testGet_fail_path_Spaces500 = () => {
    const result = lib.get('  ');

    t.assertEquals(!!result.body, true);
    t.assertEquals(500, result.status);
    t.assertEquals("text/plain", result.contentType);
    // log.info("testGet_fail_path_Spaces500 is OK. result.body = " + result.body);
}

exports.testGet_fail_path_Missing500 = () => {
    const result = lib.get();

    t.assertEquals(!!result.body, true);
    t.assertEquals(500, result.status);
    t.assertEquals("text/plain", result.contentType);
    // log.info("testGet_fail_path_Missing500 is OK. result.body = " + result.body);
}


exports.testGet_fail_path_Undef500 = () => {
    const result = lib.get(undefined);

    t.assertEquals(!!result.body, true);
    t.assertEquals(500, result.status);
    t.assertEquals("text/plain", result.contentType);
    // log.info("testGet_fail_path_Undef500 is OK. result.body = " + result.body);
}

exports.testGet_fail_path_Null500 = () => {
    const result = lib.get(null);

    t.assertEquals(!!result.body, true);
    t.assertEquals(500, result.status);
    t.assertEquals("text/plain", result.contentType);
    // log.info("testGet_fail_path_Null500 is OK. result.body = " + result.body);
}

exports.testGet_fail_path_WrongTypeNumber500 = () => {
    const result = lib.get(5);

    // log.info("testGet_fail_path_WrongTypeNumber500 is OK. result.body = " + result.body);

    t.assertEquals(!!result.body, true);
    t.assertEquals(500, result.status);
    t.assertEquals("text/plain", result.contentType);
}

exports.testGet_fail_path_WrongTypeContentArray500 = () => {
    const result = lib.get(["hey", "ho"]);

    // log.info("testGet_fail_path_Array500 is OK. result.body = " + result.body);

    t.assertEquals(!!result.body, true);
    t.assertEquals(500, result.status);
    t.assertEquals("text/plain", result.contentType);
}

exports.testGet_fail_path_WrongTypeEmptyArray500 = () => {
    const result = lib.get([]);

    // log.info("testGet_fail_path_EmptyArray500 is OK. result.body = " + result.body);

    t.assertEquals(!!result.body, true);
    t.assertEquals(500, result.status);
    t.assertEquals("text/plain", result.contentType);
}







// Options object argument

exports.testGet_objPath_Asset = () => {
    const result = lib.get({path: '/assets/asset-test-target.txt'});

    t.assertEquals("I am a test asset\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/plain", result.contentType);
};

exports.testGet_objPath_HTML = () => {
    const result = lib.get({path: '/static/static-test-html.html'});

    t.assertEquals("<html><body><p>I am a test HTML</p></body></html>\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/html", result.contentType);
};

exports.testGet_objPath_Css = () => {
    const result = lib.get({path: '/static/static-test-css.css'});

    t.assertEquals(".i.am.a.test.css {\n\n}\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/css", result.contentType);
};

exports.testGet_objPath_JS = () => {
    const result = lib.get({path: '/static/static-test-js.js'});

    t.assertEquals("console.log(\"I am a test js\");\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("application/javascript", result.contentType);
};

exports.testGet_objPath_JSON = () => {
    const result = lib.get({path: '/static/static-test-json.json'});

    t.assertEquals(`{
  "I": {
    "am": "a",
    "test": "json"
  }
}
`, result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("application/json", result.contentType);
};

exports.testGet_objPath_XML = () => {
    const result = lib.get({path: '/static/static-test-xml.xml'});

    t.assertEquals(`<I>
    <am>a</am>
    <test>xml</test>
</I>
`, result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/xml", result.contentType);
}

exports.testGet_objPath_Text = () => {
    const result = lib.get({path: '/static/static-test-text.txt'});

    t.assertEquals("I am a test text\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/plain", result.contentType);
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

exports.testGet_fail_objPath_NotFound404 = () => {
    const result = lib.get({path: '/static/doesNotExist.txt'});

    t.assertEquals(!!result.body, true);
    t.assertEquals(404, result.status);
    t.assertEquals("text/plain", result.contentType);
    // log.info("testGet_fail_objPath_NotFound404 is OK. result.body = " + result.body);
}

exports.testGet_fail_objPath_EmptyString500 = () => {
    const result = lib.get({path: ''});

    t.assertEquals(!!result.body, true);
    t.assertEquals(500, result.status);
    t.assertEquals("text/plain", result.contentType);
    // log.info("testGet_fail_objPath_EmptyString500 is OK. result.body = " + result.body);
}

exports.testGet_fail_objPath_Spaces500 = () => {
    const result = lib.get({path: '  '});

    t.assertEquals(!!result.body, true);
    t.assertEquals(500, result.status);
    t.assertEquals("text/plain", result.contentType);
    // log.info("testGet_fail_objPath_Spaces500 is OK. result.body = " + result.body);
}

exports.testGet_fail_objPath_Missing500 = () => {
    const result = lib.get({});

    t.assertEquals(!!result.body, true);
    t.assertEquals(500, result.status);
    t.assertEquals("text/plain", result.contentType);
    // log.info("testGet_fail_objPath_Missing500 is OK. result.body = " + result.body);
}

exports.testGet_fail_objPath_WrongType500 = () => {
    const result = lib.get({path: 5});

    t.assertEquals(!!result.body, true);
    t.assertEquals(500, result.status);
    t.assertEquals("text/plain", result.contentType);
    // log.info("testGet_fail_objPath_WrongType500 is OK. result.body = " + result.body);
}







// Test options object

exports.testGet_options_Undef = () => {
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
    t.assertEquals("text/plain", result.contentType);
};

exports.testGet_options_EmptyString = () => {
    // Tolerated and ignored, since obviously falsy/empty
    const result = lib.get('/assets/asset-test-target.txt', "");

    t.assertEquals("I am a test asset\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/plain", result.contentType);
};

exports.testGet_options_EmptyObject = () => {
    // Tolerated and ignored, since obviously empty
    const result = lib.get('/assets/asset-test-target.txt', {});

    t.assertEquals("I am a test asset\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/plain", result.contentType);
};

exports.testGet_fail_options_EmptyArray500 = () => {
    const result = lib.get('/assets/asset-test-target.txt', []);

    t.assertEquals(!!result.body, true);
    t.assertEquals(500, result.status);
    t.assertEquals("text/plain", result.contentType);
};

exports.testGet_fail_options_ContentArray500 = () => {
    const result = lib.get('/assets/asset-test-target.txt', ["I'm", "an", "object", "too"]);

    t.assertEquals(!!result.body, true);
    t.assertEquals(500, result.status);
    t.assertEquals("text/plain", result.contentType);
};

exports.testGet_fail_options_ContentString500 = () => {
    const result = lib.get('/assets/asset-test-target.txt', "5");

    t.assertEquals(!!result.body, true);
    t.assertEquals(500, result.status);
    t.assertEquals("text/plain", result.contentType);
};

exports.testGet_fail_options_Number500 = () => {
    const result = lib.get('/assets/asset-test-target.txt', 5);

    t.assertEquals(!!result.body, true);
    t.assertEquals(500, result.status);
    t.assertEquals("text/plain", result.contentType);
};





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

exports.testGett_fail_option_throwError_WrongObjPathType = () => {
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



