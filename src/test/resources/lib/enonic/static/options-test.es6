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
const assertCacheControlIsDefault = (cacheControl) => {
    t.assertTrue(typeof cacheControl === 'string',
        "Unexpected Cache-Control header value produced (" +
    	(Array.isArray(cacheControl) ?
    		("array[" + cacheControl.length + "]") :
    		(typeof cacheControl + (cacheControl && typeof cacheControl === 'object' ? (" with keys: " + JSON.stringify(Object.keys(cacheControl))) : ""))
    	) + "): " + JSON.stringify(cacheControl, null, 2)
    );

    // Verify: can find all the default headers
    DEFAULT_CACHE_CONTROL_PATTERNS.forEach((pattern, i) => {
        t.assertTrue(
            !!cacheControl.match(pattern),
            "Couldn't find the expected item '" + lib.DEFAULT_CACHE_CONTROL_FIELDS[i] + "' in the produced 'Cache-Control' header value: " + JSON.stringify(cacheControl) + ". Should be something like " + JSON.stringify(lib.DEFAULT_CACHE_CONTROL));
    });

    // Verify: find only the default headers
    cacheControl
        .split(/\s*,\s*/g)
        .forEach(ccHeader => {
            if (ccHeader.trim()) {
                let ccFound = false;
                DEFAULT_CACHE_CONTROL_PATTERNS.forEach(ccPattern => {
                    ccFound = ccFound || ccHeader.match(ccPattern);
                });
                t.assertTrue(ccFound, "Unexpected item '" + ccHeader + "' found in the produced 'Cache-Control' header value: " + JSON.stringify(cacheControl)  + ". Should be something like " + JSON.stringify(lib.DEFAULT_CACHE_CONTROL));
            }
        });
}



// Test the helpers:

exports.testHelpers = () => {
    assertCacheControlIsDefault("max-age=31536000, public, immutable");
    assertCacheControlIsDefault("max-age = 31536000 , public , immutable");
    assertCacheControlIsDefault("max-age=31536000 ,public ,immutable");
    assertCacheControlIsDefault("max-age=31536000,public,immutable");
    assertCacheControlIsDefault("max-age=31536000, immutable, public");
    assertCacheControlIsDefault("public, immutable, max-age=31536000");
    assertCacheControlIsDefault(", max-age=31536000, public, immutable");
    assertCacheControlIsDefault("max-age=31536000, public, immutable, ");
    assertCacheControlIsDefault("max-age=31536000, public, immutable, ,");
    assertCacheControlIsDefault("max-age=31536000, public, , immutable");
    assertCacheControlIsDefault("mAX-age=31536000, public, immutable");
    assertCacheControlIsDefault("max-age=31536000, puBLic, immutable");
    assertCacheControlIsDefault("max-age=31536000, public, immUTABLE");

    let failed = true;

    try {
        assertCacheControlIsDefault("public, immutable");
        failed = false;
    } catch (e) { }
    t.assertTrue(failed, "Should have caught missing max-age");

    try {
        assertCacheControlIsDefault("max-age=31536000, immutable");
        failed = false;
    } catch (e) { }
    t.assertTrue(failed, "Should have caught missing public");

    try {
        assertCacheControlIsDefault("max-age=31536000, public");
        failed = false;
    } catch (e) { }
    t.assertTrue(failed, "Should have caught missing immutable");

    try {
        assertCacheControlIsDefault("max-age=31536000, public, immutable, otherStuff");
        failed = false;
    } catch (e) { }
    t.assertTrue(failed, "Should have caught surplus item");

    try {
        assertCacheControlIsDefault("max-age=31536000 public, immutable");
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
    } = lib.parsePathAndOptions("i/am/a/path.txt"); // Full field output. Only writing necessary fields below.

    t.assertEquals("i/am/a/path.txt", path);
}

exports.testParsePathAndOptions_path_validStringOnly_noEtagOverride = () => {
    const { etagOverride } = lib.parsePathAndOptions("i/am/a/path.txt");

    t.assertEquals(undefined, etagOverride);
}

exports.testParsePathAndOptions_path_validStringOnly_noErrorOverride = () => {
    const { throwErrors } = lib.parsePathAndOptions("i/am/a/path.txt");

    t.assertFalse(!!throwErrors);
}

exports.testParsePathAndOptions_path_validStringOnly_noErrorsHappened = () => {
    const { errorMessage } = lib.parsePathAndOptions("i/am/a/path.txt");

    t.assertFalse(!!errorMessage); // A-OK, no errors should have been thrown, so errorMessage is falsy.
}


exports.testParsePathAndOptions_path_validStringOnly_producesDefaultMimeDetectingFunction = () => {
    const { contentTypeFunc } = lib.parsePathAndOptions("i/am/a/path.txt");

    t.assertEquals("text/plain", contentTypeFunc("i/am/a/path.txt"));
    t.assertEquals("application/javascript", contentTypeFunc("i/am/a/path.js"));
    t.assertEquals("application/json", contentTypeFunc("i/am/a/path.json"));
    t.assertEquals("image/jpeg", contentTypeFunc("i/am/a/path.jpg"));
    t.assertEquals("image/gif", contentTypeFunc("i/am/a/path.gif"));
    t.assertEquals("text/html", contentTypeFunc("i/am/a/path.html"));
    t.assertEquals("text/css", contentTypeFunc("i/am/a/path.css"));
}


exports.testParsePathAndOptions_path_validStringOnly_producesDefaultCacheControlFunction = () => {
    const { cacheControlFunc } = lib.parsePathAndOptions("i/am/a/path.txt");

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
    } = lib.parsePathAndOptions({path: "i/am/a/path.txt"}); // Only necessary fields below

    t.assertEquals("i/am/a/path.txt", path);
}

exports.testParsePathAndOptions_optionsWithPath_validObj_noEtagOverride = () => {
    const { etagOverride } = lib.parsePathAndOptions({path: "i/am/a/path.txt"});

    t.assertEquals(undefined, etagOverride);
}

exports.testParsePathAndOptions_optionsWithPath_validObj_noErrorOverride = () => {
    const { throwErrors } = lib.parsePathAndOptions({path: "i/am/a/path.txt"});

    t.assertFalse(!!throwErrors);
}

exports.testParsePathAndOptions_optionsWithPath_validObj_noErrorsHappened = () => {
    const { errorMessage } = lib.parsePathAndOptions({path: "i/am/a/path.txt"});

    t.assertFalse(!!errorMessage); // A-OK, no errors should have been thrown, so errorMessage is falsy.
}


exports.testParsePathAndOptions_optionsWithPath_validObj_producesDefaultMimeDetectingFunction = () => {
    const { contentTypeFunc } = lib.parsePathAndOptions({path: "i/am/a/path.txt"});

    t.assertEquals("text/plain", contentTypeFunc("i/am/a/path.txt"));
    t.assertEquals("application/javascript", contentTypeFunc("i/am/a/path.js"));
    t.assertEquals("application/json", contentTypeFunc("i/am/a/path.json"));
    t.assertEquals("image/jpeg", contentTypeFunc("i/am/a/path.jpg"));
    t.assertEquals("image/gif", contentTypeFunc("i/am/a/path.gif"));
    t.assertEquals("text/html", contentTypeFunc("i/am/a/path.html"));
    t.assertEquals("text/css", contentTypeFunc("i/am/a/path.css"));
}


exports.testParsePathAndOptions_optionsWithPath_validObj_producesDefaultCacheControlFunction = () => {
    const { cacheControlFunc } = lib.parsePathAndOptions({path: "i/am/a/path.txt"});

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
    } = lib.parsePathAndOptions(); // Missing args should cause error message. Only necessary fields below.

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");
    log.info("Error message (this is expected): " + errorMessage);
}

exports.testParsePathAndOptions_fail_shouldKeepDefaultThrowErrors = () => {
    const { throwErrors, } = lib.parsePathAndOptions();

    t.assertFalse(!!throwErrors);
}
exports.testParsePathAndOptions_fail_arg1_throwErrors = () => {
    const { throwErrors, } = lib.parsePathAndOptions({throwErrors: true});

    t.assertTrue(throwErrors);
}
exports.testParsePathAndOptions_fail_arg2_throwErrors = () => {
    const { throwErrors, } = lib.parsePathAndOptions(0, {throwErrors: true});

    t.assertTrue(throwErrors);
}

exports.testParsePathAndOptions_fail_shouldEliminateOtherOutputFields = () => {
    const { path, cacheControlFunc, contentTypeFunc, etagOverride } = lib.parsePathAndOptions();

    t.assertEquals(undefined, path);
    t.assertEquals(undefined, cacheControlFunc);
    t.assertEquals(undefined, contentTypeFunc);
    t.assertEquals(undefined, etagOverride);
}

exports.testParsePathAndOptions_fail_path_emptyString_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parsePathAndOptions("");

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}
exports.testParsePathAndOptions_fail_path_emptyString_throwError = () => {
    const { errorMessage, throwErrors } = lib.parsePathAndOptions("", {throwErrors: true});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
}

exports.testParsePathAndOptions_fail_path_spacesString_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parsePathAndOptions("   ");

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}
exports.testParsePathAndOptions_fail_path_spacesString_throwError = () => {
    const { errorMessage, throwErrors } = lib.parsePathAndOptions("  ", {throwErrors: true});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
}

exports.testParsePathAndOptions_fail_path_array_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parsePathAndOptions(["my", "spoon", "is", "too", "big"]);

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}
exports.testParsePathAndOptions_fail_path_array_throwError = () => {
    const { errorMessage, throwErrors } = lib.parsePathAndOptions(["my", "spoon", "is", "too", "big"], {throwErrors: true});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
}

exports.testParsePathAndOptions_fail_path_emptyArray_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parsePathAndOptions([]);

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}
exports.testParsePathAndOptions_fail_path_emptyArray_throwError = () => {
    const { errorMessage, throwErrors } = lib.parsePathAndOptions([], {throwErrors: true});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
}

exports.testParsePathAndOptions_fail_path_boolean_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parsePathAndOptions(true);

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}
exports.testParsePathAndOptions_fail_path_boolean_throwError = () => {
    const { errorMessage, throwErrors } = lib.parsePathAndOptions(true, {throwErrors: true});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
}

exports.testParsePathAndOptions_fail_path_number_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parsePathAndOptions(42);

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}
exports.testParsePathAndOptions_fail_path_number_throwError = () => {
    const { errorMessage, throwErrors } = lib.parsePathAndOptions(42, {throwErrors: true});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
}

exports.testParsePathAndOptions_fail_path_zero_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parsePathAndOptions(0);

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}
exports.testParsePathAndOptions_fail_path_zero_throwError = () => {
    const { errorMessage, throwErrors } = lib.parsePathAndOptions(0, {throwErrors: true});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
}

exports.testParsePathAndOptions_fail_path_null_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parsePathAndOptions(null);

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}
exports.testParsePathAndOptions_fail_path_null_throwError = () => {
    const { errorMessage, throwErrors } = lib.parsePathAndOptions(null, {throwErrors: true});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
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
    } = lib.parsePathAndOptions({});  // Only necessary fields below

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}
exports.testParsePathAndOptions_fail_pathAttribute_missing_shouldKeepDefaultThrowErrors = () => {
    const { throwErrors } = lib.parsePathAndOptions({});

    t.assertFalse(!!throwErrors);
}
exports.testParsePathAndOptions_fail_pathAttribute_missing_shouldEliminateOtherOutputFields = () => {
    const { path, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage } = lib.parsePathAndOptions({});

    t.assertEquals(undefined, path);
    t.assertEquals(undefined, cacheControlFunc);
    t.assertEquals(undefined, contentTypeFunc);
    t.assertEquals(undefined, etagOverride);
}
exports.testParsePathAndOptions_fail_pathAttribute_missing_throwError = () => {
    const { errorMessage, throwErrors } = lib.parsePathAndOptions(
        {
            throwErrors: true
        }
    );

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
}

exports.testParsePathAndOptions_fail_pathAttribute_emptyString_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parsePathAndOptions({path: ""});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}
exports.testParsePathAndOptions_fail_pathAttribute_emptyString_throwError = () => {
    const { errorMessage, throwErrors } = lib.parsePathAndOptions(
        {
            path: "",
            throwErrors: true
        }
    );

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
}

exports.testParsePathAndOptions_fail_pathAttribute_spacesString_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parsePathAndOptions({path: "    "});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}
exports.testParsePathAndOptions_fail_pathAttribute_spacesString_throwError = () => {
    const { errorMessage, throwErrors } = lib.parsePathAndOptions(
        {
            path: "  ",
            throwErrors: true
        }
    );

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
}

exports.testParsePathAndOptions_fail_pathAttribute_array_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parsePathAndOptions({
        path: ["my", "spoon", "is", "too", "big"]
    });

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}
exports.testParsePathAndOptions_fail_pathAttribute_array_throwError = () => {
    const { errorMessage, throwErrors } = lib.parsePathAndOptions(
        {
            path: ["my", "spoon", "is", "too", "big"],
            throwErrors: true
        }
    );

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
}

exports.testParsePathAndOptions_fail_pathAttribute_emptyArray_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parsePathAndOptions({
        path: []
    });

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}
exports.testParsePathAndOptions_fail_pathAttribute_emptyArray_throwError = () => {
    const { errorMessage, throwErrors } = lib.parsePathAndOptions(
        {
            path: [],
            throwErrors: true
        }
    );

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
}

exports.testParsePathAndOptions_fail_pathAttribute_boolean_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parsePathAndOptions({path: true});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}
exports.testParsePathAndOptions_fail_pathAttribute_boolean_throwError = () => {
    const { errorMessage, throwErrors } = lib.parsePathAndOptions(
        {
            path: true,
            throwErrors: true
        }
    );

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
}

exports.testParsePathAndOptions_fail_pathAttribute_number_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parsePathAndOptions({path: 42});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}
exports.testParsePathAndOptions_fail_pathAttribute_number_throwError = () => {
    const { errorMessage, throwErrors } = lib.parsePathAndOptions(
        {
            path: 42,
            throwErrors: true
        }
    );

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
}

exports.testParsePathAndOptions_fail_pathAttribute_zero_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parsePathAndOptions({path: 0});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}
exports.testParsePathAndOptions_fail_pathAttribute_zero_throwError = () => {
    const { errorMessage, throwErrors } = lib.parsePathAndOptions(
        {
            path: 0,
            throwErrors: true
        }
    );

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
}

exports.testParsePathAndOptions_fail_pathAttribute_null_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parsePathAndOptions({path: null});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("Error message (this is expected): " + errorMessage);
}
exports.testParsePathAndOptions_fail_pathAttribute_null_throwError = () => {
    const { errorMessage, throwErrors } = lib.parsePathAndOptions(
        {
            path: null,
            throwErrors: true
        }
    );

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
}





// Test contentType override option

exports.testParsePathAndOptions_contentType_optionsArg2_string_producesFixedMimeDetectingFunction = () => {
    const { contentTypeFunc, errorMessage } = lib.parsePathAndOptions("i/am/a/path.txt", { contentType: "fixed content type"});

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
    const { contentTypeFunc, errorMessage } = lib.parsePathAndOptions({path: "i/am/a/path.txt",  contentType: "fixed content type"});

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
    const { contentTypeFunc, errorMessage } = lib.parsePathAndOptions("i/am/a/path.txt",  {contentType: ""});

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
    const { contentTypeFunc, errorMessage } = lib.parsePathAndOptions({path: "i/am/a/path.txt",  contentType: ""});

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
    const { contentTypeFunc, errorMessage } = lib.parsePathAndOptions("i/am/a/path.txt",  {contentType: "  "});

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
    const { contentTypeFunc, errorMessage } = lib.parsePathAndOptions({path: "i/am/a/path.txt",  contentType: "  "});

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
    const { contentTypeFunc, errorMessage } = lib.parsePathAndOptions(
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
    const { contentTypeFunc, errorMessage } = lib.parsePathAndOptions({
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
    const { contentTypeFunc, errorMessage } = lib.parsePathAndOptions("i/am/a/path.txt", {
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
    const { contentTypeFunc, errorMessage }  = lib.parsePathAndOptions({
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
    const { contentTypeFunc, errorMessage }  = lib.parsePathAndOptions("i/am/a/path.txt", {
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
    const { contentTypeFunc, errorMessage }  = lib.parsePathAndOptions({
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
    const { contentTypeFunc, errorMessage } = lib.parsePathAndOptions(
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
    const { contentTypeFunc, errorMessage } = lib.parsePathAndOptions({
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


exports.testParsePathAndOptions_contentType_optionsArg2_null_shouldFail = () => {
    const result = lib.parsePathAndOptions("i/am/a/path.txt", {
        contentType: null
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParsePathAndOptions_contentType_optionsArg1_null_shouldFail = () => {
    const result = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        contentType: null
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}





// Test cacheControl override option

exports.testParsePathAndOptions_cacheControl_optionsArg2_string_producesFixedValueFunction = () => {
    const {
        path,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parsePathAndOptions("i/am/a/path.txt", {
        cacheControl: "fixed cache control"
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals("fixed cache control", cacheControlFunc("i/am/a/path.txt"));
    t.assertEquals("fixed cache control", cacheControlFunc("i/am/a/path.js"));
    t.assertEquals("fixed cache control", cacheControlFunc("i/am/a/path.json"));
    t.assertEquals("fixed cache control", cacheControlFunc("i/am/a/path.jpg"));
}
exports.testParsePathAndOptions_cacheControl_optionsArg1_string_producesFixedValueFunction = () => {
    const { cacheControlFunc, errorMessage } = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        cacheControl: "fixed cache control"
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals("fixed cache control", cacheControlFunc("i/am/a/path.txt"));
    t.assertEquals("fixed cache control", cacheControlFunc("i/am/a/path.js"));
    t.assertEquals("fixed cache control", cacheControlFunc("i/am/a/path.json"));
    t.assertEquals("fixed cache control", cacheControlFunc("i/am/a/path.jpg"));
}

exports.testParsePathAndOptions_cacheControl_optionsArg2_undefined_producesDefaultValueFunction = () => {
    const { cacheControlFunc, errorMessage } = lib.parsePathAndOptions("i/am/a/path.txt", {
        cacheControl: undefined
    });

    t.assertEquals(undefined, errorMessage);
    assertCacheControlIsDefault(cacheControlFunc("i/am/a/path.txt", "I am some content", "text/plain"));
    assertCacheControlIsDefault(cacheControlFunc("i/am/a/path.gif", "I am some content", "image/gif"));
    assertCacheControlIsDefault(cacheControlFunc("i/am/a/path.json", "I am some content", "application.json"));
}
exports.testParsePathAndOptions_cacheControl_optionsArg1_undefined_producesDefaultValueFunction = () => {
    const { cacheControlFunc, errorMessage } = lib.parsePathAndOptions({
        path: "i/am/a/path.txt"
    });

    t.assertEquals(undefined, errorMessage);
    assertCacheControlIsDefault(cacheControlFunc("i/am/a/path.txt", "I am some content", "text/plain"));
    assertCacheControlIsDefault(cacheControlFunc("i/am/a/path.gif", "I am some content", "image/gif"));
    assertCacheControlIsDefault(cacheControlFunc("i/am/a/path.json", "I am some content", "application.json"));
}

exports.testParsePathAndOptions_cacheControl_optionsArg2_true_producesDefaultValueFunction = () => {
    const { cacheControlFunc, errorMessage } = lib.parsePathAndOptions("i/am/a/path.txt", {
        cacheControl: true
    });

    t.assertEquals(undefined, errorMessage);
    assertCacheControlIsDefault(cacheControlFunc("i/am/a/path.txt", "I am some content", "text/plain"));
    assertCacheControlIsDefault(cacheControlFunc("i/am/a/path.gif", "I am some content", "image/gif"));
    assertCacheControlIsDefault(cacheControlFunc("i/am/a/path.json", "I am some content", "application.json"));
}
exports.testParsePathAndOptions_cacheControl_optionsArg1_true_producesDefaultValueFunction = () => {
    const { cacheControlFunc, errorMessage } = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        cacheControl: true
    });

    t.assertEquals(undefined, errorMessage);
    assertCacheControlIsDefault(cacheControlFunc("i/am/a/path.txt", "I am some content", "text/plain"));
    assertCacheControlIsDefault(cacheControlFunc("i/am/a/path.gif", "I am some content", "image/gif"));
    assertCacheControlIsDefault(cacheControlFunc("i/am/a/path.json", "I am some content", "application.json"));
}

exports.testParsePathAndOptions_cacheControl_optionsArg2_false_producesDefaultValueFunction = () => {
    const { cacheControlFunc, errorMessage } = lib.parsePathAndOptions("i/am/a/path.txt",{
        cacheControl: false
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.txt", "I am some content", "text/plain"));
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.gif", "I am some content", "image/gif"));
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.json", "I am some content", "application.json"));
}
exports.testParsePathAndOptions_cacheControl_optionsArg1_false_producesDefaultValueFunction = () => {
    const { cacheControlFunc, errorMessage } = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        cacheControl: false
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.txt", "I am some content", "text/plain"));
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.gif", "I am some content", "image/gif"));
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.json", "I am some content", "application.json"));
}

exports.testParsePathAndOptions_cacheControl_optionsArg2_emptyString_producesDefaultValueFunction = () => {
    const { cacheControlFunc, errorMessage } = lib.parsePathAndOptions("i/am/a/path.txt",{
        cacheControl: ''
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.txt", "I am some content", "text/plain"));
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.gif", "I am some content", "image/gif"));
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.json", "I am some content", "application.json"));
}
exports.testParsePathAndOptions_cacheControl_optionsArg1_emptyString_producesDefaultValueFunction = () => {
    const { cacheControlFunc, errorMessage } = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        cacheControl: ''
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.txt", "I am some content", "text/plain"));
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.gif", "I am some content", "image/gif"));
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.json", "I am some content", "application.json"));
}

exports.testParsePathAndOptions_cacheControl_optionsArg1_allSpaceString_producesDefaultValueFunction = () => {
    const { cacheControlFunc, errorMessage } = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        cacheControl: '  '
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.txt", "I am some content", "text/plain"));
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.gif", "I am some content", "image/gif"));
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.json", "I am some content", "application.json"));
}
exports.testParsePathAndOptions_cacheControl_optionsArg1_allSpaceString_producesDefaultValueFunction = () => {
    const { cacheControlFunc, errorMessage } = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        cacheControl: '  '
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.txt", "I am some content", "text/plain"));
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.gif", "I am some content", "image/gif"));
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.json", "I am some content", "application.json"));
}

const TEST_CACHECONTROL_FUNC = (path, content, mimeType) => {
    if (content.indexOf("override") !== -1) {
        return "Special OVERRIDE text cacheControl header";
    }
    if (path.endsWith(".txt")) {
        return "Special text cacheControl header";
    }
    if (mimeType === "application/json") {
        return "Special text JSON header"
    }
    if (mimeType.trim() === '') {
        return undefined; // All-space / emptystring mimeTypes
    }
    if (mimeType === undefined) {
        throw Error("Demonstrating a particular cacheControl function that fails if no mimeTypeis provided");
    }
    // Fallback: null means use default cachecontrol header.
    return null;
};

exports.testParsePathAndOptions_cacheControl_optionsArg2_func_usesFunction = () => {
    const ccFunc = (path, content, mimeType) => {
        if (content.indexOf("override") !== -1) {
            return "Special OVERRIDE text cacheControl header";
        }
        if (path.endsWith(".txt")) {
            return "Special text cacheControl header";
        }
        if (mimeType === "application/json") {
            return "Special text JSON header"
        }
    }

    const { cacheControlFunc, errorMessage } = lib.parsePathAndOptions("i/am/a/path.txt", {
        cacheControl: ccFunc
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals("Special text cacheControl header", cacheControlFunc("i/am/a/path.txt", "I am some content", "text/plain"));
    t.assertEquals("Special OVERRIDE text cacheControl header", cacheControlFunc("i/am/a/path.txt", "I am some override text content", "text/plain"));
    t.assertEquals("Special text JSON header", cacheControlFunc("i/am/a/path.json", "I am some content", "application/json"));
}
exports.testParsePathAndOptions_cacheControl_optionsArg1_func_usesFunction = () => {
    const ccFunc = (path, content, mimeType) => {
        if (content.indexOf("override") !== -1) {
            return "Special OVERRIDE text cacheControl header";
        }
        if (path.endsWith(".txt")) {
            return "Special text cacheControl header";
        }
        if (mimeType === "application/json") {
            return "Special text JSON header"
        }
    }

    const { cacheControlFunc, errorMessage } = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        cacheControl: ccFunc
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals("Special text cacheControl header", cacheControlFunc("i/am/a/path.txt", "I am some content", "text/plain"));
    t.assertEquals("Special OVERRIDE text cacheControl header", cacheControlFunc("i/am/a/path.txt", "I am some override text content", "text/plain"));
    t.assertEquals("Special text JSON header", cacheControlFunc("i/am/a/path.json", "I am some content", "application/json"));
}

exports.testParsePathAndOptions_cacheControl_optionsArg2_failingFunc_throwsErrorInsteadOfReturningErrorMessage = () => {
    const ccFunc = (path, content, mimeType) => {
        if (mimeType === undefined) {
            throw Error("Demonstrating a particular cacheControl function that fails if no mimeTypeis provided");
        }
    };

    const { cacheControlFunc, errorMessage } = lib.parsePathAndOptions("no/mime/type/so/testfunc/will/crash", {
        cacheControl: ccFunc
    });

    t.assertEquals(undefined, errorMessage);
    let failed = true;
    try {
        log.error(cacheControlFunc("no/mime/type/so/testfunc/will/crash", "I am some content"));
        failed = false;
    } catch (e) { }

    t.assertTrue(failed, "Should have failed");
}
exports.testParsePathAndOptions_cacheControl_optionsArg1_failingFunc_throwsErrorInsteadOfReturningErrorMessage = () => {
    const ccFunc = (path, content, mimeType) => {
        if (mimeType === undefined) {
            throw Error("Demonstrating a particular cacheControl function that fails if no mimeTypeis provided");
        }
    };

    const { cacheControlFunc, errorMessage } = lib.parsePathAndOptions({
        path: "no/mime/type/so/testfunc/will/crash",
        cacheControl: ccFunc
    });

    t.assertEquals(undefined, errorMessage);
    let failed = true;
    try {
        log.error(cacheControlFunc("no/mime/type/so/testfunc/will/crash", "I am some content"));
        failed = false;
    } catch (e) { }

    t.assertTrue(failed, "Should have failed");
}

exports.testParsePathAndOptions_cacheControl_optionsArg2_failingFunc_stillRetainsThrowErrorsParam = () => {
    const ccFunc = (path, content, mimeType) => {
        if (mimeType === undefined) {
            throw Error("Demonstrating a particular cacheControl function that fails if no mimeTypeis provided");
        }
    };

    const { cacheControlFunc, errorMessage, throwErrors } = lib.parsePathAndOptions("no/mime/type/so/testfunc/will/crash", {
        cacheControl: ccFunc,
        throwErrors: true
    });

    t.assertEquals(undefined, errorMessage);
    let failed = true;
    try {
        log.error(cacheControlFunc("no/mime/type/so/testfunc/will/crash", "I am some content"));
        failed = false;
    } catch (e) { }

    t.assertTrue(failed, "Should have failed");
    t.assertTrue(throwErrors);
}
exports.testParsePathAndOptions_cacheControl_optionsArg1_failingFunc_stillRetainsThrowErrorsParam = () => {
    const ccFunc = (path, content, mimeType) => {
        if (mimeType === undefined) {
            throw Error("Demonstrating a particular cacheControl function that fails if no mimeTypeis provided");
        }
    };

    const { cacheControlFunc, errorMessage, throwErrors } = lib.parsePathAndOptions({
        path: "no/mime/type/so/testfunc/will/crash",
        cacheControl: ccFunc,
        throwErrors: true
    });

    t.assertEquals(undefined, errorMessage);
    let failed = true;
    try {
        log.error(cacheControlFunc("no/mime/type/so/testfunc/will/crash", "I am some content"));
        failed = false;
    } catch (e) { }

    t.assertTrue(failed, "Should have failed");
    t.assertTrue(throwErrors);
}

exports.testParsePathAndOptions_cacheControl_optionsArg2_func_returnedUndefinedProducesNoCachecontrolHeader = () => {
    const ccFunc = (path, content, mimeType) => {
        if (mimeType.trim() === '') {
            return undefined; // All-space / emptystring mimeTypes
        }
    };

    const { cacheControlFunc, errorMessage } = lib.parsePathAndOptions("empty/mime/type/so/testfunc/returns/undefined", {
        cacheControl: ccFunc
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(undefined, cacheControlFunc("empty/mime/type/so/testfunc/returns/undefined", "I am some content", ""));
}
exports.testParsePathAndOptions_cacheControl_optionsArg1_func_returnedUndefinedProducesNoCachecontrolHeader = () => {
    const ccFunc = (path, content, mimeType) => {
        if (mimeType.trim() === '') {
            return undefined; // All-space / emptystring mimeTypes
        }
    };

    const { cacheControlFunc, errorMessage } = lib.parsePathAndOptions({
        path: "empty/mime/type/so/testfunc/returns/undefined",
        cacheControl: ccFunc
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(undefined, cacheControlFunc("empty/mime/type/so/testfunc/returns/undefined", "I am some content", "  "));
}

exports.testParsePathAndOptions_cacheControl_optionsArg2_func_returnedNullFallsBackToDefaultCachecontrol = () => {
    const ccFunc = (path, content, mimeType) => {
        if (mimeType.trim() === '') {
            return null; // All-space / emptystring mimeTypes
        }
    };

    const { cacheControlFunc, errorMessage } = lib.parsePathAndOptions("empty/mime/type/so/testfunc/returns/null", {
        cacheControl: ccFunc
    });

    t.assertEquals(undefined, errorMessage);
    assertCacheControlIsDefault(cacheControlFunc("empty/mime/type/so/testfunc/returns/null", "I am some content", "  "));
}
exports.testParsePathAndOptions_cacheControl_optionsArg1_func_returnedNullFallsBackToDefaultCachecontrol = () => {
    const ccFunc = (path, content, mimeType) => {
        if (mimeType.trim() === '') {
            return null; // All-space / emptystring mimeTypes
        }
    };

    const { cacheControlFunc, errorMessage } = lib.parsePathAndOptions({
        path: "empty/mime/type/so/testfunc/returns/null",
        cacheControl: ccFunc
    });

    t.assertEquals(undefined, errorMessage);
    assertCacheControlIsDefault(cacheControlFunc("no/mime/type/so/testfunc/returns/null", "I am some content", ""));
}



// Test invalid cacheControl params, should produce error message but still keep throwErrors argument

exports.testParsePathAndOptions_contentType_optionsArg2_failingShouldParseTrueThrowErrorsArg = () => {
    const result = lib.parsePathAndOptions("i/am/a/path.txt", {
        cacheControl: {},
        throwErrors: true
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParsePathAndOptions_contentType_optionsArg2_failingShouldParseFalseThrowErrorsArg = () => {
    const  result = lib.parsePathAndOptions("i/am/a/path.txt", {
        cacheControl: {},
        throwErrors: false
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParsePathAndOptions_contentType_optionsArg1_failingShouldParseTrueThrowErrorsArg = () => {
    const  result = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        cacheControl: {},
        throwErrors: true
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(result.throwErrors, "Expected to fail but still keep throwErrors");
}


exports.testParsePathAndOptions_contentType_optionsArg2_emptyObj_shouldFail = () => {
    const result = lib.parsePathAndOptions("i/am/a/path.txt",{
        cacheControl: {},
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParsePathAndOptions_contentType_optionsArg1_emptyObj_shouldFail = () => {
    const result = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        cacheControl: {},
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}


exports.testParsePathAndOptions_contentType_optionsArg2_obj_shouldFail = () => {
    const result = lib.parsePathAndOptions("i/am/a/path.txt",{
        cacheControl: {i: "object", your: "honor"},
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParsePathAndOptions_contentType_optionsArg1_obj_shouldFail = () => {
    const result = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        cacheControl: {i: "object", your: "honor"},
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}

exports.testParsePathAndOptions_contentType_optionsArg2_zero_shouldFail = () => {
    const result = lib.parsePathAndOptions("i/am/a/path.txt",{
        cacheControl: 0,
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParsePathAndOptions_contentType_optionsArg1_zero_shouldFail = () => {
    const result = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        cacheControl: 0,
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}

exports.testParsePathAndOptions_contentType_optionsArg2_number_shouldFail = () => {
    const result = lib.parsePathAndOptions("i/am/a/path.txt",{
        cacheControl: 42,
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParsePathAndOptions_contentType_optionsArg1_number_shouldFail = () => {
    const result = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        cacheControl: 42,
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}

exports.testParsePathAndOptions_contentType_optionsArg2_null_shouldFail = () => {
    const result = lib.parsePathAndOptions("i/am/a/path.txt",{
        cacheControl: null,
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParsePathAndOptions_contentType_optionsArg1_null_shouldFail = () => {
    const result = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        cacheControl: null,
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}

exports.testParsePathAndOptions_contentType_optionsArg2_emptyArray_shouldFail = () => {
    const result = lib.parsePathAndOptions("i/am/a/path.txt",{
        cacheControl: [],
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParsePathAndOptions_contentType_optionsArg1_emptyArray_shouldFail = () => {
    const result = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        cacheControl: [],
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}

exports.testParsePathAndOptions_contentType_optionsArg2_array_shouldFail = () => {
    const result = lib.parsePathAndOptions("i/am/a/path.txt",{
        cacheControl: ["i", "pretend", "to", "be", "an", "object"],
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParsePathAndOptions_contentType_optionsArg1_array_shouldFail = () => {
    const result = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        cacheControl: ["i", "pretend", "to", "be", "an", "object"],
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}



// Test etag options

exports.testParsePathAndOptions_etag_optionsArg2_true_returnsTrue = () => {
    const {
        path,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parsePathAndOptions("i/am/a/path.txt", {
        etag: true
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(true, etagOverride);
}
exports.testParsePathAndOptions_etag_optionsArg1_true_returnsTrue = () => {
    const { etagOverride, errorMessage } = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        etag: true
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(true, etagOverride);
}

exports.testParsePathAndOptions_etag_optionsArg2_false_returnsFalse = () => {
    const {
        path,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parsePathAndOptions("i/am/a/path.txt", {
        etag: false
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(false, etagOverride);
}
exports.testParsePathAndOptions_etag_optionsArg1_false_returnsFalse = () => {
    const { etagOverride, errorMessage } = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        etag: false
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(false, etagOverride);
}

exports.testParsePathAndOptions_etag_optionsArg2_undefined_returnsUndefined = () => {
    const {
        path,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parsePathAndOptions("i/am/a/path.txt", {
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(undefined, etagOverride);
}
exports.testParsePathAndOptions_etag_optionsArg1_undefined_returnsUndefined = () => {
    const { etagOverride, errorMessage } = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        etag: undefined
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(undefined, etagOverride);
}


// Test etag override error handling
exports.testParsePathAndOptions_etag_optionsArg2_null_shouldFail = () => {
    const result = lib.parsePathAndOptions("i/am/a/path.txt",{
        etag: null
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}
exports.testParsePathAndOptions_etag_optionsArg1_null_shouldFail = () => {
    const result = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        etag: null
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}
exports.testParsePathAndOptions_etag_optionsArg2_null_failingShouldStillReturnThrowErrors = () => {
    const result = lib.parsePathAndOptions("i/am/a/path.txt",{
        etag: null,
        throwErrors: true
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(result.throwErrors);
}
exports.testParsePathAndOptions_etag_optionsArg1_null_failingShouldStillReturnThrowErrors = () => {
    const result = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        etag: null,
        throwErrors: true
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(result.throwErrors);
}

exports.testParsePathAndOptions_etag_optionsArg2_zero_shouldFail = () => {
    const result = lib.parsePathAndOptions("i/am/a/path.txt",{
        etag: 0
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}
exports.testParsePathAndOptions_etag_optionsArg1_zero_shouldFail = () => {
    const result = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        etag: 0
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}

exports.testParsePathAndOptions_etag_optionsArg2_number_shouldFail = () => {
    const result = lib.parsePathAndOptions("i/am/a/path.txt",{
        etag: 42
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}
exports.testParsePathAndOptions_etag_optionsArg1_number_shouldFail = () => {
    const result = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        etag: 42
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}

exports.testParsePathAndOptions_etag_optionsArg2_emptyObject_shouldFail = () => {
    const result = lib.parsePathAndOptions("i/am/a/path.txt",{
        etag: {}
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}
exports.testParsePathAndOptions_etag_optionsArg1_emptyObject_shouldFail = () => {
    const result = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        etag: {}
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}

exports.testParsePathAndOptions_etag_optionsArg2_object_shouldFail = () => {
    const result = lib.parsePathAndOptions("i/am/a/path.txt",{
        etag: {i: "object"}
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}
exports.testParsePathAndOptions_etag_optionsArg1_object_shouldFail = () => {
    const result = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        etag: {i: "object"}
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}

exports.testParsePathAndOptions_etag_optionsArg2_emptyString_shouldFail = () => {
    const result = lib.parsePathAndOptions("i/am/a/path.txt",{
        etag: ""
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}
exports.testParsePathAndOptions_etag_optionsArg1_emptyString_shouldFail = () => {
    const result = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        etag: ""
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}

exports.testParsePathAndOptions_etag_optionsArg2_string_shouldFail = () => {
    const result = lib.parsePathAndOptions("i/am/a/path.txt",{
        etag: "I'm a string"
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}
exports.testParsePathAndOptions_etag_optionsArg1_string_shouldFail = () => {
    const result = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        etag: "I'm a string"
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}

exports.testParsePathAndOptions_etag_optionsArg2_allSpaceString_shouldFail = () => {
    const result = lib.parsePathAndOptions("i/am/a/path.txt",{
        etag: "  "
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}
exports.testParsePathAndOptions_etag_optionsArg1_allSpaceString_shouldFail = () => {
    const result = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        etag: "  "
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}

exports.testParsePathAndOptions_etag_optionsArg2_emptyArray_shouldFail = () => {
    const result = lib.parsePathAndOptions("i/am/a/path.txt",{
        etag: []
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}
exports.testParsePathAndOptions_etag_optionsArg1_emptyArray_shouldFail = () => {
    const result = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        etag: []
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}

exports.testParsePathAndOptions_etag_optionsArg2_array_shouldFail = () => {
    const result = lib.parsePathAndOptions("i/am/a/path.txt",{
        etag: ["me", "array"]
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}
exports.testParsePathAndOptions_etag_optionsArg1_array_shouldFail = () => {
    const result = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        etag: ["you", "jane"]
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.path && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}
