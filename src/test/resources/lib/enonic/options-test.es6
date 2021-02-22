const lib = require('/lib/enonic/static/options');
const t = require('/lib/xp/testing');


////////////////////////////////////////////////////////////////// Helpers

// Turning the strings to regex patterns
const DEFAULT_CACHE_CONTROL_PATTERNS = lib.DEFAULT_CACHE_CONTROL_FIELDS.map(item => {
    const replacedItem = item
        .replace(/\s*([=])\s*/g,"\\s*$1\\s*");
    return new RegExp("(" +
        "(^\\s*,?\\s*\\b" + replacedItem + "\\b\\s*,?\\s*$)|" +
        "(\\s*,\\s*\\b" + replacedItem + "\\b\\s*,?\\s*)|" +
        "(\\s*,?\\s*\\b" + replacedItem + "\\b\\s*,\\s*)" +
        ")",
        "gi");
});

// Verify cache-control headers unrestricted to the literal string (order, case, spaces)
const assertCacheControlIsDefault = (result) => {
    t.assertTrue(result.headers && typeof result.headers === 'object' && typeof result.headers['Cache-Control'] === 'string', "The result should contain a 'headers' attribute with a 'Cache-Control' key under it. Result=" + JSON.stringify(result));

    // Verify: can find all the default headers
    DEFAULT_CACHE_CONTROL_PATTERNS.forEach((pattern, i) => {
        t.assertTrue(
            !!result.headers['Cache-Control'].match(pattern),
            "Couldn't find the expected item '" + lib.DEFAULT_CACHE_CONTROL_FIELDS[i] + "' in the result's 'Cache-Control' header: " + JSON.stringify(result.headers['Cache-Control']) + ". Should be something like " + JSON.stringify(lib.DEFAULT_CACHE_CONTROL))
    });

    // Verify: find only the default headers
    result.headers['Cache-Control']
        .split(/\s*,\s*/g)
        .forEach(ccHeader => {
            if (ccHeader.trim()) {
                let ccFound = false;
                DEFAULT_CACHE_CONTROL_PATTERNS.forEach(ccPattern => {
                    ccFound = ccFound || ccHeader.match(ccPattern);
                });
                t.assertTrue(ccFound, "Unexpected item '" + ccHeader + "' found in the result's 'Cache-Control' header. Should only be something like: " + JSON.stringify(lib.DEFAULT_CACHE_CONTROL))
            }
        });
}



// Test the helpers:

exports.testHelpers = () => {
    assertCacheControlIsDefault({headers: {'Cache-Control': "max-age=31536000, public, immutable"}});
    assertCacheControlIsDefault({headers: {'Cache-Control': "max-age = 31536000 , public , immutable"}});
    assertCacheControlIsDefault({headers: {'Cache-Control': "max-age=31536000 ,public ,immutable"}});
    assertCacheControlIsDefault({headers: {'Cache-Control': "max-age=31536000,public,immutable"}});
    assertCacheControlIsDefault({headers: {'Cache-Control': "max-age=31536000, immutable, public"}});
    assertCacheControlIsDefault({headers: {'Cache-Control': "public, immutable, max-age=31536000"}});
    assertCacheControlIsDefault({headers: {'Cache-Control': ", max-age=31536000, public, immutable"}});
    assertCacheControlIsDefault({headers: {'Cache-Control': "max-age=31536000, public, immutable, "}});
    assertCacheControlIsDefault({headers: {'Cache-Control': "max-age=31536000, public, immutable, ,"}});
    assertCacheControlIsDefault({headers: {'Cache-Control': "max-age=31536000, public, , immutable"}});
    assertCacheControlIsDefault({headers: {'Cache-Control': "mAX-age=31536000, public, immutable"}});
    assertCacheControlIsDefault({headers: {'Cache-Control': "max-age=31536000, puBLic, immutable"}});
    assertCacheControlIsDefault({headers: {'Cache-Control': "max-age=31536000, public, immUTABLE"}});

    let failed = true;

    try {
        assertCacheControlIsDefault({headers: {'Cache-Control': "public, immutable"}});
        failed = false;
    } catch (e) { }
    t.assertTrue(failed, "Should have caught missing max-age");

    try {
        assertCacheControlIsDefault({headers: {'Cache-Control': "max-age=31536000, immutable"}});
        failed = false;
    } catch (e) { }
    t.assertTrue(failed, "Should have caught missing public");

    try {
        assertCacheControlIsDefault({headers: {'Cache-Control': "max-age=31536000, public"}});
        failed = false;
    } catch (e) { }
    t.assertTrue(failed, "Should have caught missing immutable");

    try {
        assertCacheControlIsDefault({headers: {'Cache-Control': "max-age=31536000, public, immutable, otherStuff"}});
        failed = false;
    } catch (e) { }
    t.assertTrue(failed, "Should have caught surplus item");

    try {
        assertCacheControlIsDefault({headers: {'Cache-Control': "max-age=31536000 public, immutable"}});
        failed = false;
    } catch (e) { }
    t.assertTrue(failed, "Should have caught missing comma");
};









//////////////////////////////////////////////////////////////////  TEST .parsePathAndOptions

// Test first argument: path string

exports.testParsePathAndOptions_path_validStringOnly_extractsPath = () => {
    const {
        path,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parsePathAndOptions("i/am/a/path.txt"); // This is a one-liner below

    t.assertEquals("i/am/a/path.txt", path);
}

exports.testParsePathAndOptions_path_validStringOnly_noEtagOverride = () => {
    const { path, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage } = lib.parsePathAndOptions("i/am/a/path.txt");

    t.assertEquals(undefined, etagOverride);
}

exports.testParsePathAndOptions_path_validStringOnly_noErrorOverride = () => {
    const { path, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage } = lib.parsePathAndOptions("i/am/a/path.txt");

    t.assertFalse(!!throwErrors);
}

exports.testParsePathAndOptions_path_validStringOnly_noErrorsHappened = () => {
    const { path, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage } = lib.parsePathAndOptions("i/am/a/path.txt");

    t.assertFalse(!!errorMessage); // A-OK, no errors should have been thrown, so errorMessage is falsy.
}


exports.testParsePathAndOptions_path_validStringOnly_producesDefaultMimeDetectingFunction = () => {
    const { path, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage } = lib.parsePathAndOptions("i/am/a/path.txt");

    t.assertEquals("text/plain", contentTypeFunc("i/am/a/path.txt"));
    t.assertEquals("application/javascript", contentTypeFunc("i/am/a/path.js"));
    t.assertEquals("application/json", contentTypeFunc("i/am/a/path.json"));
    t.assertEquals("image/jpeg", contentTypeFunc("i/am/a/path.jpg"));
    t.assertEquals("image/gif", contentTypeFunc("i/am/a/path.gif"));
    t.assertEquals("text/html", contentTypeFunc("i/am/a/path.html"));
    t.assertEquals("text/css", contentTypeFunc("i/am/a/path.css"));
}


exports.testParsePathAndOptions_path_validStringOnly_producesDefaultCacheControlFunction = () => {
    const { path, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage } = lib.parsePathAndOptions("i/am/a/path.txt");

    t.assertEquals(lib.DEFAULT_CACHE_CONTROL, cacheControlFunc("i/am/a/path.txt", "Some random content", "text/plain"));
    t.assertEquals(lib.DEFAULT_CACHE_CONTROL, cacheControlFunc("i/am/a/path.js", "Some random content", "application/javascript"));
    t.assertEquals(lib.DEFAULT_CACHE_CONTROL, cacheControlFunc("i/am/a/path.json", "Some random content", "application/javascripton"));
    t.assertEquals(lib.DEFAULT_CACHE_CONTROL, cacheControlFunc("i/am/a/path.html", "Some random content", "text/html"));
}



// Test first argument: options object with path attribute

exports.testParsePathAndOptions_optionsWithPath_validObj_extractsPath = () => {
    const {
        path,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parsePathAndOptions({path: "i/am/a/path.txt"}); // This is a one-liner below

    t.assertEquals("i/am/a/path.txt", path);
}

exports.testParsePathAndOptions_optionsWithPath_validObj_noEtagOverride = () => {
    const { path, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage } = lib.parsePathAndOptions({path: "i/am/a/path.txt"});

    t.assertEquals(undefined, etagOverride);
}

exports.testParsePathAndOptions_optionsWithPath_validObj_noErrorOverride = () => {
    const { path, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage } = lib.parsePathAndOptions({path: "i/am/a/path.txt"});

    t.assertFalse(!!throwErrors);
}

exports.testParsePathAndOptions_optionsWithPath_validObj_noErrorsHappened = () => {
    const { path, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage } = lib.parsePathAndOptions({path: "i/am/a/path.txt"});

    t.assertFalse(!!errorMessage); // A-OK, no errors should have been thrown, so errorMessage is falsy.
}


exports.testParsePathAndOptions_optionsWithPath_validObj_producesDefaultMimeDetectingFunction = () => {
    const { path, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage } = lib.parsePathAndOptions({path: "i/am/a/path.txt"});

    t.assertEquals("text/plain", contentTypeFunc("i/am/a/path.txt"));
    t.assertEquals("application/javascript", contentTypeFunc("i/am/a/path.js"));
    t.assertEquals("application/json", contentTypeFunc("i/am/a/path.json"));
    t.assertEquals("image/jpeg", contentTypeFunc("i/am/a/path.jpg"));
    t.assertEquals("image/gif", contentTypeFunc("i/am/a/path.gif"));
    t.assertEquals("text/html", contentTypeFunc("i/am/a/path.html"));
    t.assertEquals("text/css", contentTypeFunc("i/am/a/path.css"));
}


exports.testParsePathAndOptions_optionsWithPath_validObj_producesDefaultCacheControlFunction = () => {
    const { path, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage } = lib.parsePathAndOptions({path: "i/am/a/path.txt"});

    t.assertEquals(lib.DEFAULT_CACHE_CONTROL, cacheControlFunc("i/am/a/path.txt", "Some random content", "text/plain"));
    t.assertEquals(lib.DEFAULT_CACHE_CONTROL, cacheControlFunc("i/am/a/path.js", "Some random content", "application/javascript"));
    t.assertEquals(lib.DEFAULT_CACHE_CONTROL, cacheControlFunc("i/am/a/path.json", "Some random content", "application/javascripton"));
    t.assertEquals(lib.DEFAULT_CACHE_CONTROL, cacheControlFunc("i/am/a/path.html", "Some random content", "text/html"));
}



// Provoke errors: first argument

exports.testParsePathAndOptions_fail_shouldYieldErrorMessage = () => {
    const {
        path,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parsePathAndOptions(); // Missing args causes error. This is a one-liner below.

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");
    log.info("Error message (this is expected): " + errorMessage);
}

exports.testParsePathAndOptions_fail_shouldKeepDefaultThrowErrors = () => {
    const { path, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage } = lib.parsePathAndOptions();

    t.assertFalse(!!throwErrors);
}

exports.testParsePathAndOptions_fail_shouldEliminateOtherOutputFields = () => {
    const { path, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage } = lib.parsePathAndOptions();

    t.assertEquals(undefined, path);
    t.assertEquals(undefined, cacheControlFunc);
    t.assertEquals(undefined, contentTypeFunc);
    t.assertEquals(undefined, etagOverride);
}

exports.testParsePathAndOptions_fail_path_emptyString_shouldYieldErrorMessage = () => {
    const {
        path,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parsePathAndOptions("");

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}

exports.testParsePathAndOptions_fail_path_spacesString_shouldYieldErrorMessage = () => {
    const {
        path,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parsePathAndOptions("   ");

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}

exports.testParsePathAndOptions_fail_path_array_shouldYieldErrorMessage = () => {
    const {
        path,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parsePathAndOptions(["my", "spoon", "is", "too", "big"]);

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}

exports.testParsePathAndOptions_fail_path_emptyArray_shouldYieldErrorMessage = () => {
    const {
        path,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parsePathAndOptions([]);

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}

exports.testParsePathAndOptions_fail_path_boolean_shouldYieldErrorMessage = () => {
    const {
        path,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parsePathAndOptions(true);

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}

exports.testParsePathAndOptions_fail_path_number_shouldYieldErrorMessage = () => {
    const {
        path,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parsePathAndOptions(42);

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}

exports.testParsePathAndOptions_fail_path_zero_shouldYieldErrorMessage = () => {
    const {
        path,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parsePathAndOptions(0);

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}

exports.testParsePathAndOptions_fail_path_null_shouldYieldErrorMessage = () => {
    const {
        path,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parsePathAndOptions(null);

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}

// Provoke errors: path as attribute in first optionsWithPath object

exports.testParsePathAndOptions_fail_pathAttribute_missing_shouldYieldErrorMessage = () => {
    const {
        path,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parsePathAndOptions({});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}


exports.testParsePathAndOptions_fail_pathAttribute_missing_shouldKeepDefaultThrowErrors = () => {
    const { path, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage } = lib.parsePathAndOptions({});

    t.assertFalse(!!throwErrors);
}

exports.testParsePathAndOptions_fail_pathAttribute_missing_shouldEliminateOtherOutputFields = () => {
    const { path, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage } = lib.parsePathAndOptions({});

    t.assertEquals(undefined, path);
    t.assertEquals(undefined, cacheControlFunc);
    t.assertEquals(undefined, contentTypeFunc);
    t.assertEquals(undefined, etagOverride);
}

exports.testParsePathAndOptions_fail_pathAttribute_emptyString_shouldYieldErrorMessage = () => {
    const {
        path,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parsePathAndOptions({path: ""});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}

exports.testParsePathAndOptions_fail_pathAttribute_spacesString_shouldYieldErrorMessage = () => {
    const {
        path,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parsePathAndOptions({path: "    "});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}

exports.testParsePathAndOptions_fail_pathAttribute_array_shouldYieldErrorMessage = () => {
    const {
        path,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parsePathAndOptions({path: ["my", "spoon", "is", "too", "big"]});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}

exports.testParsePathAndOptions_fail_pathAttribute_emptyArray_shouldYieldErrorMessage = () => {
    const {
        path,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parsePathAndOptions({path: []});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}

exports.testParsePathAndOptions_fail_pathAttribute_boolean_shouldYieldErrorMessage = () => {
    const {
        path,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parsePathAndOptions({path: true});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}

exports.testParsePathAndOptions_fail_pathAttribute_number_shouldYieldErrorMessage = () => {
    const {
        path,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parsePathAndOptions({path: 42});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}

exports.testParsePathAndOptions_fail_pathAttribute_zero_shouldYieldErrorMessage = () => {
    const {
        path,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parsePathAndOptions({path: 0});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}

exports.testParsePathAndOptions_fail_pathAttribute_null_shouldYieldErrorMessage = () => {
    const {
        path,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parsePathAndOptions({path: null});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}


// Test contentType override option

exports.testParsePathAndOptions_contentType_optionsArg2_string_producesFixedMimeDetectingFunction = () => {
    const {
        path, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage
    } = lib.parsePathAndOptions("i/am/a/path.txt", { contentType: "fixed content type"});

    t.assertEquals(undefined, errorMessage);
    t.assertEquals("fixed content type", contentTypeFunc("i/am/a/path.txt"));
    t.assertEquals("fixed content type", contentTypeFunc("i/am/a/path.js"));
    t.assertEquals("fixed content type", contentTypeFunc("i/am/a/path.json"));
    t.assertEquals("fixed content type", contentTypeFunc("i/am/a/path.jpg"));
    t.assertEquals("fixed content type", contentTypeFunc("i/am/a/path.gif"));
    t.assertEquals("fixed content type", contentTypeFunc("i/am/a/path.html"));
    t.assertEquals("fixed content type", contentTypeFunc("i/am/a/path.css"));
}

exports.testParsePathAndOptions_contentType_optionsArg1_string_producesFixedMimeDetectingFunction = () => {
    const {
        path, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage
    } = lib.parsePathAndOptions({path: "i/am/a/path.txt",  contentType: "fixed content type"});

    t.assertEquals(undefined, errorMessage);
    t.assertEquals("fixed content type", contentTypeFunc("i/am/a/path.txt"));
    t.assertEquals("fixed content type", contentTypeFunc("i/am/a/path.js"));
    t.assertEquals("fixed content type", contentTypeFunc("i/am/a/path.json"));
    t.assertEquals("fixed content type", contentTypeFunc("i/am/a/path.jpg"));
    t.assertEquals("fixed content type", contentTypeFunc("i/am/a/path.gif"));
    t.assertEquals("fixed content type", contentTypeFunc("i/am/a/path.html"));
    t.assertEquals("fixed content type", contentTypeFunc("i/am/a/path.css"));
}

exports.testParsePathAndOptions_contentType_optionsArg2_emptyString_disablesContentType = () => {
    const {
        path, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage
    } = lib.parsePathAndOptions("i/am/a/path.txt",  {contentType: ""});

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.txt"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.js"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.json"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.jpg"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.gif"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.html"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.css"));
}
exports.testParsePathAndOptions_contentType_optionsArg1_emptyString_disablesContentType = () => {
    const {
        path, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage
    } = lib.parsePathAndOptions({path: "i/am/a/path.txt",  contentType: ""});

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.txt"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.js"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.json"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.jpg"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.gif"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.html"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.css"));
}
exports.testParsePathAndOptions_contentType_optionsArg2_allSpaceString_disablesContentType = () => {
    const {
        path, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage
    } = lib.parsePathAndOptions("i/am/a/path.txt",  {contentType: "  "});

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.txt"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.js"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.json"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.jpg"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.gif"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.html"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.css"));
}
exports.testParsePathAndOptions_contentType_optionsArg1_allSpaceString_disablesContentType = () => {
    const {
        path, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage
    } = lib.parsePathAndOptions({path: "i/am/a/path.txt",  contentType: "  "});

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.txt"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.js"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.json"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.jpg"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.gif"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.html"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.css"));
}

exports.testParsePathAndOptions_contentType_optionsArg2_object_producesLookupMimeDetectingFunctionWithFallback = () => {
    const {
        path, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage
    } = lib.parsePathAndOptions(
        "i/am/a/path.txt",
        {
            contentType: {
                // Case or dot shouldn't matter
                "json": "OVERRIDDEN/JSON",
                "GIF": "OVERRIDDEN/GIF",
                ".html": "OVERRIDDEN/HTML",
                ".CSS": "OVERRIDDEN/CSS",
            }
        });

    t.assertEquals(undefined, errorMessage);
    // Lookup:
    t.assertEquals("OVERRIDDEN/JSON", contentTypeFunc("i/am/a/path.json"));
    t.assertEquals("OVERRIDDEN/GIF", contentTypeFunc("i/am/a/path.gif"));
    t.assertEquals("OVERRIDDEN/HTML", contentTypeFunc("i/am/a/path.html"));
    t.assertEquals("OVERRIDDEN/CSS", contentTypeFunc("i/am/a/path.css"));
    // Fallback after missing from lookup object:
    t.assertEquals("text/plain", contentTypeFunc("i/am/a/path.txt"));
    t.assertEquals("application/javascript", contentTypeFunc("i/am/a/path.js"));
    t.assertEquals("image/jpeg", contentTypeFunc("i/am/a/path.jpg"));
}


exports.testParsePathAndOptions_contentType_optionsArg1_object_producesLookupMimeDetectingFunctionWithFallback = () => {
    const {
        path, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage
    } = lib.parsePathAndOptions({
            path: "i/am/a/path.txt",
            contentType: {
                // Case or dot shouldn't matter
                "json": "OVERRIDDEN/JSON",
                "GIF": "OVERRIDDEN/GIF",
                ".html": "OVERRIDDEN/HTML",
                ".CSS": "OVERRIDDEN/CSS",
            }
        });

    t.assertEquals(undefined, errorMessage);
    // Lookup:
    t.assertEquals("OVERRIDDEN/JSON", contentTypeFunc("i/am/a/path.json"));
    t.assertEquals("OVERRIDDEN/GIF", contentTypeFunc("i/am/a/path.gif"));
    t.assertEquals("OVERRIDDEN/HTML", contentTypeFunc("i/am/a/path.html"));
    t.assertEquals("OVERRIDDEN/CSS", contentTypeFunc("i/am/a/path.css"));
    // Fallback after missing from lookup object:
    t.assertEquals("text/plain", contentTypeFunc("i/am/a/path.txt"));
    t.assertEquals("application/javascript", contentTypeFunc("i/am/a/path.js"));
    t.assertEquals("image/jpeg", contentTypeFunc("i/am/a/path.jpg"));
}
exports.testParsePathAndOptions_contentType_optionsArg2_emptyObject_producesDefaultFunction = () => {
    const {
        path, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage
    } = lib.parsePathAndOptions("i/am/a/path.txt", {
        contentType: {}
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals("text/plain", contentTypeFunc("i/am/a/path.txt"));
    t.assertEquals("application/javascript", contentTypeFunc("i/am/a/path.js"));
    t.assertEquals("application/json", contentTypeFunc("i/am/a/path.json"));
    t.assertEquals("image/jpeg", contentTypeFunc("i/am/a/path.jpg"));
    t.assertEquals("image/gif", contentTypeFunc("i/am/a/path.gif"));
    t.assertEquals("text/html", contentTypeFunc("i/am/a/path.html"));
    t.assertEquals("text/css", contentTypeFunc("i/am/a/path.css"));
}
exports.testParsePathAndOptions_contentType_optionsArg1_emptyObject_producesDefaultFunction = () => {
    const {
        path, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage
    } = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        contentType: {}
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals("text/plain", contentTypeFunc("i/am/a/path.txt"));
    t.assertEquals("application/javascript", contentTypeFunc("i/am/a/path.js"));
    t.assertEquals("application/json", contentTypeFunc("i/am/a/path.json"));
    t.assertEquals("image/jpeg", contentTypeFunc("i/am/a/path.jpg"));
    t.assertEquals("image/gif", contentTypeFunc("i/am/a/path.gif"));
    t.assertEquals("text/html", contentTypeFunc("i/am/a/path.html"));
    t.assertEquals("text/css", contentTypeFunc("i/am/a/path.css"));
}
exports.testParsePathAndOptions_contentType_optionsArg2_true_producesDefaultFunction = () => {
    const {
        path, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage
    } = lib.parsePathAndOptions("i/am/a/path.txt", {
        contentType: true
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals("text/plain", contentTypeFunc("i/am/a/path.txt"));
    t.assertEquals("application/javascript", contentTypeFunc("i/am/a/path.js"));
    t.assertEquals("application/json", contentTypeFunc("i/am/a/path.json"));
    t.assertEquals("image/jpeg", contentTypeFunc("i/am/a/path.jpg"));
    t.assertEquals("image/gif", contentTypeFunc("i/am/a/path.gif"));
    t.assertEquals("text/html", contentTypeFunc("i/am/a/path.html"));
    t.assertEquals("text/css", contentTypeFunc("i/am/a/path.css"));
}
exports.testParsePathAndOptions_contentType_optionsArg1_true_producesDefaultFunction = () => {
    const {
        path, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage
    } = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        contentType: true
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals("text/plain", contentTypeFunc("i/am/a/path.txt"));
    t.assertEquals("application/javascript", contentTypeFunc("i/am/a/path.js"));
    t.assertEquals("application/json", contentTypeFunc("i/am/a/path.json"));
    t.assertEquals("image/jpeg", contentTypeFunc("i/am/a/path.jpg"));
    t.assertEquals("image/gif", contentTypeFunc("i/am/a/path.gif"));
    t.assertEquals("text/html", contentTypeFunc("i/am/a/path.html"));
    t.assertEquals("text/css", contentTypeFunc("i/am/a/path.css"));
}



exports.testParsePathAndOptions_contentType_optionsArg2_func_replacesMimeDetectingFunctionKeepsFallback = () => {
    const {
        path, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage
    } = lib.parsePathAndOptions(
        "i/am/a/path.txt",
        {
            contentType: (path) => {
                // Override for one particular gif
                if (path === "i/am/the/TARGET.gif") {
                    return "OVERRIDDEN/GIF";
                }

                // remove contentType header entirely for the html:
                if (path.indexOf("html") !== -1) {
                    return undefined;
                }

                // Fall back to default handling on everything else:
                return null;
            }
        });

    t.assertEquals(undefined, errorMessage);
    // Changed by function
    t.assertEquals("OVERRIDDEN/GIF", contentTypeFunc("i/am/the/TARGET.gif"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.html"));

    // Fallback to built-in detection, when contentType returns null:
    t.assertEquals("image/gif", contentTypeFunc("i/am/a/DIFFERENT.gif"));
    t.assertEquals("text/plain", contentTypeFunc("i/am/a/path.txt"));
    t.assertEquals("application/javascript", contentTypeFunc("i/am/a/path.js"));
    t.assertEquals("image/jpeg", contentTypeFunc("i/am/a/path.jpg"));
    t.assertEquals("application/json", contentTypeFunc("i/am/a/path.json"));
    t.assertEquals("text/css", contentTypeFunc("i/am/a/path.css"));
}
exports.testParsePathAndOptions_contentType_optionsArg1_func_replacesMimeDetectingFunctionKeepsFallback = () => {
    const {
        path, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage
    } = lib.parsePathAndOptions({
            path: "i/am/a/path.txt",
            contentType: (path) => {
                // Override for one particular gif
                if (path === "i/am/the/TARGET.gif") {
                    return "OVERRIDDEN/GIF";
                }

                // remove contentType header entirely for the html:
                if (path.indexOf("html") !== -1) {
                    return undefined;
                }

                // Fall back to default handling on everything else:
                return null;
            }
        });

    t.assertEquals(undefined, errorMessage);
    // Changed by function
    t.assertEquals("OVERRIDDEN/GIF", contentTypeFunc("i/am/the/TARGET.gif"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.html"));

    // Fallback to built-in detection, when contentType returns null:
    t.assertEquals("image/gif", contentTypeFunc("i/am/a/DIFFERENT.gif"));
    t.assertEquals("text/plain", contentTypeFunc("i/am/a/path.txt"));
    t.assertEquals("application/javascript", contentTypeFunc("i/am/a/path.js"));
    t.assertEquals("image/jpeg", contentTypeFunc("i/am/a/path.jpg"));
    t.assertEquals("application/json", contentTypeFunc("i/am/a/path.json"));
    t.assertEquals("text/css", contentTypeFunc("i/am/a/path.css"));
}

// Test invalid contentTypes, should produce error message but still keep throwErrors argument

exports.testParsePathAndOptions_contentType_optionsArg2_failingShouldParseTrueThrowErrorsArg = () => {
    const result = lib.parsePathAndOptions("i/am/a/path.txt", {
        contentType: 0,
        throwErrors: true
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParsePathAndOptions_contentType_optionsArg2_failingShouldParseFalseThrowErrorsArg = () => {
    const result = lib.parsePathAndOptions("i/am/a/path.txt", {
        contentType: 0,
        throwErrors: false
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParsePathAndOptions_contentType_optionsArg1_failingShouldParseTrueThrowErrorsArg = () => {
    const result = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        contentType: 0,
        throwErrors: true
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(result.throwErrors, "Expected to fail but still keep throwErrors");
}


exports.testParsePathAndOptions_contentType_optionsArg2_zero_shouldFail = () => {
    const result = lib.parsePathAndOptions("i/am/a/path.txt",{
        contentType: 0
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParsePathAndOptions_contentType_optionsArg1_zero_shouldFail = () => {
    const result = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        contentType: 0
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}


exports.testParsePathAndOptions_contentType_optionsArg2_number_shouldFail = () => {
    const result = lib.parsePathAndOptions("i/am/a/path.txt",{
        contentType: 42
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParsePathAndOptions_contentType_optionsArg1_number_shouldFail = () => {
    const result = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        contentType: 42
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}


exports.testParsePathAndOptions_contentType_optionsArg2_emptyArray_shouldFail = () => {
    const result = lib.parsePathAndOptions("i/am/a/path.txt", {
        contentType: []
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParsePathAndOptions_contentType_optionsArg1_emptyArray_shouldFail = () => {
    const result = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        contentType: []
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}


exports.testParsePathAndOptions_contentType_optionsArg2_array_shouldFail = () => {
    const result = lib.parsePathAndOptions("i/am/a/path.txt", {
        contentType: ["i", "am", "groot"]
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParsePathAndOptions_contentType_optionsArg1_array_shouldFail = () => {
    const result = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        contentType: ["i", "am", "kloot"]
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}
