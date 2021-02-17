const lib = require('/lib/enonic/static/etaggingResourceReader');
const t = require('/lib/xp/testing');



exports.testReadAndTag_Asset = () => {
    const result = lib.read('/assets/asset-test-target.txt');

    t.assertEquals("I am a test asset\n", result.body);
    t.assertEquals(200, result.status);

    log.info("result.etag (" +
    	(Array.isArray(result.etag) ?
    		("array[" + result.etag.length + "]") :
    		(typeof result.etag + (result.etag && typeof result.etag === 'object' ? (" with keys: " + JSON.stringify(Object.keys(result.etag))) : ""))
    	) + "): " + JSON.stringify(result.etag, null, 2)
    );
};

exports.testReadAndTag_HTML = () => {
    const result = lib.read('/static/static-test-html.html');

    t.assertEquals("<html><body><p>I am a test HTML</p></body></html>\n", result.body);
    t.assertEquals(200, result.status);

    log.info("result.etag (" +
        (Array.isArray(result.etag) ?
                ("array[" + result.etag.length + "]") :
                (typeof result.etag + (result.etag && typeof result.etag === 'object' ? (" with keys: " + JSON.stringify(Object.keys(result.etag))) : ""))
        ) + "): " + JSON.stringify(result.etag, null, 2)
    );
};

exports.testReadAndTag_CSS = () => {
    const result = lib.read('/static/static-test-css.css');

    t.assertEquals(".i.am.a.test.css {\n\n}\n", result.body);
    t.assertEquals(200, result.status);

    log.info("result.etag (" +
        (Array.isArray(result.etag) ?
                ("array[" + result.etag.length + "]") :
                (typeof result.etag + (result.etag && typeof result.etag === 'object' ? (" with keys: " + JSON.stringify(Object.keys(result.etag))) : ""))
        ) + "): " + JSON.stringify(result.etag, null, 2)
    );
};

exports.testReadAndTag_JS = () => {
    const result = lib.read('/static/static-test-js.js');

    t.assertEquals("console.log(\"I am a test js\");\n", result.body);
    t.assertEquals(200, result.status);

    log.info("result.etag (" +
        (Array.isArray(result.etag) ?
                ("array[" + result.etag.length + "]") :
                (typeof result.etag + (result.etag && typeof result.etag === 'object' ? (" with keys: " + JSON.stringify(Object.keys(result.etag))) : ""))
        ) + "): " + JSON.stringify(result.etag, null, 2)
    );
};

exports.testReadAndTag_JSON = () => {
    const result = lib.read('/static/static-test-json.json');

    t.assertEquals(`{
  "I": {
    "am": "a",
    "test": "json"
  }
}
`, result.body);
    t.assertEquals(200, result.status);

    log.info("result.etag (" +
        (Array.isArray(result.etag) ?
                ("array[" + result.etag.length + "]") :
                (typeof result.etag + (result.etag && typeof result.etag === 'object' ? (" with keys: " + JSON.stringify(Object.keys(result.etag))) : ""))
        ) + "): " + JSON.stringify(result.etag, null, 2)
    );
};

exports.testReadAndTag_XML = () => {
    const result = lib.read('/static/static-test-xml.xml');

    t.assertEquals(`<I>
    <am>a</am>
    <test>xml</test>
</I>
`, result.body);
    t.assertEquals(200, result.status);

    log.info("result.etag (" +
        (Array.isArray(result.etag) ?
                ("array[" + result.etag.length + "]") :
                (typeof result.etag + (result.etag && typeof result.etag === 'object' ? (" with keys: " + JSON.stringify(Object.keys(result.etag))) : ""))
        ) + "): " + JSON.stringify(result.etag, null, 2)
    );
}

exports.testReadAndTag_Text = () => {
    const result = lib.read('/static/static-test-text.txt');

    t.assertEquals("I am a test text\n", result.body);
    t.assertEquals(200, result.status);

    log.info("result.etag (" +
        (Array.isArray(result.etag) ?
                ("array[" + result.etag.length + "]") :
                (typeof result.etag + (result.etag && typeof result.etag === 'object' ? (" with keys: " + JSON.stringify(Object.keys(result.etag))) : ""))
        ) + "): " + JSON.stringify(result.etag, null, 2)
    );
}

exports.testReadAndTag_JPG = () => {
    const result = lib.read('/static/w3c_home.jpg');

    t.assertEquals(200, result.status);

    log.info("result.etag (" +
        (Array.isArray(result.etag) ?
                ("array[" + result.etag.length + "]") :
                (typeof result.etag + (result.etag && typeof result.etag === 'object' ? (" with keys: " + JSON.stringify(Object.keys(result.etag))) : ""))
        ) + "): " + JSON.stringify(result.etag, null, 2)
    );
};

exports.testReadAndTag_GIF = () => {
    const result = lib.read('/static/w3c_home.gif');

    t.assertEquals(200, result.status);

    log.info("result.etag (" +
        (Array.isArray(result.etag) ?
                ("array[" + result.etag.length + "]") :
                (typeof result.etag + (result.etag && typeof result.etag === 'object' ? (" with keys: " + JSON.stringify(Object.keys(result.etag))) : ""))
        ) + "): " + JSON.stringify(result.etag, null, 2)
    );
};

// Path error handling

exports.testReadAndTag_NotFound_should404 = () => {
    const result = lib.read('/static/doesNotExist.txt');

    t.assertTrue(!!result.body);
    t.assertEquals(404, result.status);
    t.assertTrue(!result.etag);

    // log.info("testGet_fail_path_NotFound_should404 is OK. result.body = " + result.body);
}

exports.testGet_fail_path_EmptyString_should500_Thorough = () => {
    const result = lib.read('');

    t.assertTrue(!!result.body);
    t.assertEquals(500, result.status);
    t.assertTrue(!result.etag);

    // log.info("testGet_fail_path_EmptyString_should500 is OK. result.body = " + result.body);
}
