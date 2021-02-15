const lib = require('./static');
const t = require('/lib/xp/testing');

exports.testGet_Asset = () => {
    const result = lib.get('/assets/asset-test-target.txt');

    t.assertEquals("I am a test asset\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/plain", result.contentType);
};

exports.testGet_HTML = () => {
    const result = lib.get('/static/static-test-html.html');

    t.assertEquals("<html><body><p>I am a test HTML</p></body></html>\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/html", result.contentType);
};

exports.testGet_Css = () => {
    const result = lib.get('/static/static-test-css.css');

    t.assertEquals(".i.am.a.test.css {\n\n}\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/css", result.contentType);
};

exports.testGet_JS = () => {
    const result = lib.get('/static/static-test-js.js');

    t.assertEquals("console.log(\"I am a test js\");\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("application/javascript", result.contentType);
};

exports.testGet_JSON = () => {
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

exports.testGet_XML = () => {
    const result = lib.get('/static/static-test-xml.xml');

    t.assertEquals(`<I>
    <am>a</am>
    <test>xml</test>
</I>
`, result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/xml", result.contentType);
}

exports.Text = () => {
    const result = lib.get('/static/static-test-text.txt');

    t.assertEquals("I am a test text\n", result.body);
    t.assertEquals(200, result.status);
    t.assertEquals("text/plain", result.contentType);
}

exports.testGet_JPG = () => {
    const result = lib.get('/static/w3c_home.jpg');

    t.assertEquals(200, result.status);
    t.assertEquals("image/jpeg", result.contentType);
};

exports.testGet_GIF = () => {
    const result = lib.get('/static/w3c_home.gif');

    t.assertEquals(200, result.status);
    t.assertEquals("image/gif", result.contentType);
};

exports.testGet_fail404 = () => {
    const result = lib.get('/static/doesNotExist.txt');

    t.assertEquals(!!result.body, true);
    t.assertEquals(404, result.status);
    t.assertEquals("text/plain", result.contentType);
}
