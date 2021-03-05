const lib = require('/lib/enonic/static/etagReader');
const t = require('/lib/xp/testing');

const ioLib = require('/lib/enonic/static/io');


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

exports.testRead_Asset = () => {
    const path = '/assets/asset-test-target.txt';
    const result = lib.read(path);

    t.assertEquals(200, result.status);
    t.assertTrue(!result.error);

    const resource = ioLib.getResource(path);
    const content = ioLib.readText(resource.getStream());
    verifyEtagAndContent(result.etagValue, content);
};

exports.testRead_HTML = () => {
    const path = '/static/static-test-html.html';
    const result = lib.read(path);

    t.assertEquals(200, result.status);
    t.assertTrue(!result.error);

    const resource = ioLib.getResource(path);
    const content = ioLib.readText(resource.getStream());
    verifyEtagAndContent(result.etagValue, content);
};

exports.testRead_CSS = () => {
    const path = '/static/static-test-css.css';
    const result = lib.read(path);

    t.assertEquals(200, result.status);
    t.assertTrue(!result.error);

    const resource = ioLib.getResource(path);
    const content = ioLib.readText(resource.getStream());
    verifyEtagAndContent(result.etagValue, content);
};

exports.testRead_JS = () => {
    const path = '/static/static-test-js.js';
    const result = lib.read(path);

    t.assertEquals(200, result.status);
    t.assertTrue(!result.error);

    const resource = ioLib.getResource(path);
    const content = ioLib.readText(resource.getStream());
    verifyEtagAndContent(result.etagValue, content);
};

exports.testRead_JSON = () => {
    const path = '/static/static-test-json.json';
    const result = lib.read(path);

    t.assertEquals(200, result.status);
    t.assertTrue(!result.error);

    const resource = ioLib.getResource(path);
    const content = ioLib.readText(resource.getStream());
    verifyEtagAndContent(result.etagValue, content);
};

exports.testRead_XML = () => {
    const path = '/static/static-test-xml.xml';
    const result = lib.read(path);

    t.assertEquals(200, result.status);
    t.assertTrue(!result.error);

    const resource = ioLib.getResource(path);
    const content = ioLib.readText(resource.getStream());
    verifyEtagAndContent(result.etagValue, content);
};

exports.testRead_Text = () => {
    const path = '/static/static-test-text.txt';
    const result = lib.read(path);

    t.assertEquals(200, result.status);
    t.assertTrue(!result.error);

    const resource = ioLib.getResource(path);
    const content = ioLib.readText(resource.getStream());
    verifyEtagAndContent(result.etagValue, content);
};

exports.testRead_JPG = () => {
    const path = '/static/w3c_home.jpg';
    const result = lib.read(path);

    t.assertEquals(200, result.status);
    t.assertTrue(!result.error);

    const resource = ioLib.getResource(path);
    const content = ioLib.readText(resource.getStream());
    verifyEtagAndContent(result.etagValue, content);
};


// Path error handling

exports.testRead_NotFound_should404 = () => {
    const result = lib.read('/static/thisDoesNotExist.txt');

    t.assertTrue(!!result.error);
    t.assertEquals(404, result.status);
    t.assertTrue(!result.etagValue); // No etag on 404!
}

exports.testGet_fail_path_EmptyString_should400_Thorough = () => {
    const result = lib.read('');

    t.assertTrue(!!result.error);
    t.assertEquals(400, result.status);
    t.assertTrue(!result.etagValue); // No etag on 400!
}
