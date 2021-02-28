const lib = require('/lib/enonic/static/etagReader');
const t = require('/lib/xp/testing');



// HELPERS

/* Maps etag keys and corresponding content values, in order to guarantee that one content always corresponds to the same etag and vice versa. */
let verifierMap = {};

const verifyEtagAndContent = (etag, content) => {
    t.assertNotEquals(undefined, etag, "Content should not have generated an unidentified etag: " + JSON.stringify(content));
    const previousContent = verifierMap[etag];
    if (previousContent) {
        t.assertEquals(content, previousContent, "The same etag '" + etag + "' was now produced by a different content than before. Should be 1:1.\n\tNow:    " + JSON.stringify(content) + "\n\tBefore: " + JSON.stringify(previousContent));
    }
    verifierMap[etag] = content;

    const previousEtag = verifierMap[content];
    if (previousEtag) {
        t.assertEquals(previousEtag, etag, "This content has previously produced the etag '" + etag + "' but now produced '" + previousEtag + "'. Should be 1:1.\n\tContent: " +  JSON.stringify(content));
    }
    verifierMap[content] = etag;
}


// Test the helper

exports.testHelper_OK = () => {
    verifyEtagAndContent("a", "heisann");
    verifyEtagAndContent("b", "hoppsann");
    verifyEtagAndContent("c", "fallerallera");

    verifyEtagAndContent("b", "hoppsann");
    verifyEtagAndContent("a", "heisann");
    verifyEtagAndContent("c", "fallerallera");
    verifyEtagAndContent("a", "heisann");
    verifyEtagAndContent("b", "hoppsann");
    verifyEtagAndContent("c", "fallerallera");
    verifyEtagAndContent("a", "heisann");
    verifyEtagAndContent("c", "fallerallera");
    verifyEtagAndContent("b", "hoppsann");
    verifyEtagAndContent("b", "hoppsann");
    verifyEtagAndContent("a", "heisann");
    verifyEtagAndContent("c", "fallerallera");

    verifierMap = {};
}

exports.testHelper_ETag_collision = () => {
    verifyEtagAndContent("a", "any");
    verifyEtagAndContent("b", "second");
    verifyEtagAndContent("c", "now");

    let failed = true;

    try {
        verifyEtagAndContent("a", "faderullandei");
        failed = false;
    } catch (e) {
        t.assertTrue(failed, "Should have picked up that the etag 'a' has been generated before, for a different content");
    }

    verifierMap = {};
}

exports.testHelper_Content_deviasion = () => {
    verifyEtagAndContent("a", "if i");
    verifyEtagAndContent("b", "had an");
    verifyEtagAndContent("c", "umbrella");
    let failed = true;

    try {
        verifyEtagAndContent("e", "umbrella");
        failed = false;
    } catch (e) {
        t.assertTrue(failed, "Should have picked up that the content 'umbrella' has previously generated a different etag");
    }

    verifierMap = {};
}



/////////////////////////////////////////////////////// Test .read:

exports.testReadAndTag_Asset = () => {
    const result = lib.read('/assets/asset-test-target.txt');

    t.assertEquals("I am a test asset\n", result.body);
    t.assertEquals(200, result.status);
    verifyEtagAndContent(result.etagValue, result.body);
};

exports.testReadAndTag_HTML = () => {
    const result = lib.read('/static/static-test-html.html');

    t.assertEquals("<html><body><p>I am a test HTML</p></body></html>\n", result.body);
    t.assertEquals(200, result.status);
    verifyEtagAndContent(result.etagValue, result.body);
};

exports.testReadAndTag_CSS = () => {
    const result = lib.read('/static/static-test-css.css');

    t.assertEquals(".i.am.a.test.css {\n\n}\n", result.body);
    t.assertEquals(200, result.status);
    verifyEtagAndContent(result.etagValue, result.body);
};

exports.testReadAndTag_JS = () => {
    const result = lib.read('/static/static-test-js.js');

    t.assertEquals("console.log(\"I am a test js\");\n", result.body);
    t.assertEquals(200, result.status);
    verifyEtagAndContent(result.etagValue, result.body);
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
    verifyEtagAndContent(result.etagValue, result.body);
};

exports.testReadAndTag_XML = () => {
    const result = lib.read('/static/static-test-xml.xml');

    t.assertEquals(`<I>
    <am>a</am>
    <test>xml</test>
</I>
`, result.body);
    t.assertEquals(200, result.status);
    verifyEtagAndContent(result.etagValue, result.body);
}

exports.testReadAndTag_Text = () => {
    const result = lib.read('/static/static-test-text.txt');

    t.assertEquals("I am a test text\n", result.body);
    t.assertEquals(200, result.status);
    verifyEtagAndContent(result.etagValue, result.body);
}

exports.testReadAndTag_JPG = () => {
    const result = lib.read('/static/w3c_home.jpg');

    t.assertEquals(200, result.status);
    verifyEtagAndContent(result.etagValue, result.body);
};

exports.testReadAndTag_GIF = () => {
    const result = lib.read('/static/w3c_home.gif');

    t.assertEquals(200, result.status);
    verifyEtagAndContent(result.etagValue, result.body);
};

// Path error handling

exports.testReadAndTag_NotFound_should404 = () => {
    const result = lib.read('/static/doesNotExist.txt');

    t.assertTrue(!!result.body);
    t.assertEquals(404, result.status);
    t.assertTrue(!result.etagValue); // No etag on 404!
}

exports.testGet_fail_path_EmptyString_should500_Thorough = () => {
    const result = lib.read('');

    t.assertTrue(!!result.body);
    t.assertEquals(500, result.status);
    t.assertTrue(!result.etagValue); // No etag on 500!
}
