const ioLib = require('/lib/enonic/static/io');

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

exports.testParsePathAndOptions_path_pathArg_emptyString_passThrough = () => {
    const { path, errorMessage } = lib.parsePathAndOptions("");

    t.assertEquals(undefined, errorMessage);
    t.assertEquals('', path);

    log.info("OK: " + errorMessage);
}
exports.testParsePathAndOptions_path_optionsArg_emptyString_passThrough = () => {
    const { path, errorMessage } = lib.parsePathAndOptions({path: ""});

    t.assertEquals(undefined, errorMessage);
    t.assertEquals('', path);
}

exports.testParsePathAndOptions_path_pathArg_spacesString_onlyTrim = () => {
    const { path, errorMessage } = lib.parsePathAndOptions("   ");

    t.assertEquals(undefined, errorMessage);
    t.assertEquals('', path);
}
exports.testParsePathAndOptions_path_optionsArg_spacesString_onlyTrim = () => {
    const { path, errorMessage } = lib.parsePathAndOptions({path: "  "});

    t.assertEquals(undefined, errorMessage);
    t.assertEquals('', path);
}

exports.testParsePathAndOptions_path_pathArg_pathWithSpaces_trim = () => {
    const { path, errorMessage } = lib.parsePathAndOptions(" my/path  ");

    t.assertEquals(undefined, errorMessage);
    t.assertEquals('my/path', path);
}
exports.testParsePathAndOptions_path_optionsArg_pathWithSpaces_trim = () => {
    const { path, errorMessage } = lib.parsePathAndOptions({path: "  my/path "});

    t.assertEquals(undefined, errorMessage);
    t.assertEquals('my/path', path);
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
    log.info("OK: " + errorMessage);
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

exports.testParsePathAndOptions_fail_path_array_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parsePathAndOptions(["my", "spoon", "is", "too", "big"]);

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("OK: " + errorMessage);
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

    log.info("OK: " + errorMessage);
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

    log.info("OK: " + errorMessage);
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

    log.info("OK: " + errorMessage);
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

    log.info("OK: " + errorMessage);
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

    log.info("OK: " + errorMessage);
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

    log.info("OK: " + errorMessage);
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

exports.testParsePathAndOptions_fail_pathAttribute_array_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parsePathAndOptions({
        path: ["my", "spoon", "is", "too", "big"]
    });

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("OK: " + errorMessage);
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

    log.info("OK: " + errorMessage);
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

    log.info("OK: " + errorMessage);
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

    log.info("OK: " + errorMessage);
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

    log.info("OK: " + errorMessage);
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

    log.info("OK: " + errorMessage);
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


exports.testParsePathAndOptions_contentType_optionsArg2_func_mimeDetectionWithContent = () => {
    const { contentTypeFunc, errorMessage } = lib.parsePathAndOptions(
        "nevermindpath",
        {
            contentType: (path, resource) => {
                // Override for one particular content
                if (ioLib.readText(resource.getStream()) === "I am a test asset\n") {
                    return "OVERRIDDEN/TESTASSET";
                }

                // Fall back to default handling on everything else:
                return "everything/else";
            }
        });

    t.assertEquals(undefined, errorMessage);
    // Function only uses content in this case, not path

    // FIXME: ioLib.getResource can't find the files here:
    /*
    t.assertEquals("everything/else", contentTypeFunc("nevermindpath", ioLib.getResource('myapplication:static/static-test-text.txt')));
    t.assertEquals("everything/else", contentTypeFunc("nevermindpath", ioLib.getResource('myapplication:static/static-test-js.js')));
    t.assertEquals("OVERRIDDEN/TESTASSET", contentTypeFunc("nevermindpath", ioLib.getResource('myapplication:assets/asset-test-target.txt')));
    t.assertEquals("everything/else", contentTypeFunc("nevermindpath", ioLib.getResource('myapplication:static/w3c_home.gif')));
    //*/
}
exports.testParsePathAndOptions_contentType_optionsArg1_func_replacesMimeDetectingFunctionKeepsFallback = () => {
    const { contentTypeFunc, errorMessage } = lib.parsePathAndOptions(
        {
            path: "nevermindpath",
            contentType: (path, resource) => {
                // Override for one particular content
                const content = ioLib.readText(resource.getStream());
                if (content === "I am a test asset\n") {
                    return "OVERRIDDEN/TESTASSET";
                }

                // Fall back to default handling on everything else:
                return "everything/else";
            }
        });

    t.assertEquals(undefined, errorMessage);
    // Function only uses content in this case, not path

    // FIXME: ioLib.getResource can't find the files here:
    /*
    t.assertEquals("everything/else", contentTypeFunc("nevermindpath", ioLib.getResource('myapplication:static/static-test-text.txt')));
    t.assertEquals("everything/else", contentTypeFunc("nevermindpath", ioLib.getResource('myapplication:static/static-test-js.js')));
    t.assertEquals("OVERRIDDEN/TESTASSET", contentTypeFunc("nevermindpath", ioLib.getResource('myapplication:assets/asset-test-target.txt')));
    t.assertEquals("everything/else", contentTypeFunc("nevermindpath", ioLib.getResource('myapplication:static/w3c_home.gif')));
    //*/
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

exports.testParsePathAndOptions_cacheControl_optionsArg2_func_usesFunction = () => {
    const ccFunc = (path, resource, mimeType) => {
        const content = ioLib.readText(resource.getStream());
        if (content.indexOf("text") !== -1) {
            return "Special OVERRIDE text cacheControl header";
        }
        if (path.endsWith(".txt")) {
            return "Special text cacheControl header";
        }
        if (mimeType === "application/json") {
            return "Special text JSON header"
        }
        return "other";
    }

    const { cacheControlFunc, errorMessage } = lib.parsePathAndOptions("i/am/a/path.txt", {
        cacheControl: ccFunc
    });

    t.assertEquals(undefined, errorMessage);

    // FIXME: ioLib.getResource can't find the files here
    /*
    t.assertEquals("Special text cacheControl header", cacheControlFunc("assets/asset-test-target.txt", ioLib.getResource("myapplication:assets/asset-test-target.txt"), "text/plain"));
    t.assertEquals("Special OVERRIDE text cacheControl header", cacheControlFunc("static/static-test-text.txt", ioLib.getResource("myapplication:static/static-test-text.txt"), "text/plain"));
    t.assertEquals("Special text JSON header", cacheControlFunc("static/static-test-js.js", ioLib.getResource("myapplication:static/static-test-js.js"), "application/json"));
    t.assertEquals("other", cacheControlFunc("static/static-test-json.json", ioLib.getResource("myapplication:static/static-test-json.json"), "application/json"));
    //*/
}
exports.testParsePathAndOptions_cacheControl_optionsArg1_func_usesFunction = () => {
    const ccFunc = (path, resource, mimeType) => {
        const content = ioLib.readText(resource.getStream());
        if (content.indexOf("text") !== -1) {
            return "Special OVERRIDE text cacheControl header";
        }
        if (path.endsWith(".txt")) {
            return "Special text cacheControl header";
        }
        if (mimeType === "application/json") {
            return "Special text JSON header"
        }
        return "other";
    }

    const { cacheControlFunc, errorMessage } = lib.parsePathAndOptions({
        path: "i/am/a/path.txt",
        cacheControl: ccFunc
    });

    t.assertEquals(undefined, errorMessage);

    // FIXME: ioLib.getResource can't find the files here
    /*
    t.assertEquals("Special text cacheControl header", cacheControlFunc("assets/asset-test-target.txt", ioLib.getResource("myapplication:assets/asset-test-target.txt"), "text/plain"));
    t.assertEquals("Special OVERRIDE text cacheControl header", cacheControlFunc("static/static-test-text.txt", ioLib.getResource("myapplication:static/static-test-text.txt"), "text/plain"));
    t.assertEquals("Special text JSON header", cacheControlFunc("static/static-test-js.js", ioLib.getResource("myapplication:static/static-test-js.js"), "application/json"));
    t.assertEquals("other", cacheControlFunc("static/static-test-json.json", ioLib.getResource("myapplication:static/static-test-json.json"), "application/json"));
    //*/
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









//////////////////////////////////////////////////////////////////// TEST .parseRootAndOptions



// Test first argument: root string

exports.testParseRootAndOptions_path_validStringOnly_extractsPath = () => {
    const {
        root,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parseRootAndOptions("i/am/root"); // Full field output. Only writing necessary fields below.

    t.assertEquals("i/am/root", root);
}

exports.testParseRootAndOptions_path_validStringOnly_noEtagOverride = () => {
    const { etagOverride } = lib.parseRootAndOptions("i/am/root");

    t.assertEquals(undefined, etagOverride);
}

exports.testParseRootAndOptions_path_validStringOnly_noErrorOverride = () => {
    const { throwErrors } = lib.parseRootAndOptions("i/am/root");

    t.assertFalse(!!throwErrors);
}

exports.testParseRootAndOptions_path_validStringOnly_noErrorsHappened = () => {
    const { errorMessage } = lib.parseRootAndOptions("i/am/root");

    t.assertFalse(!!errorMessage); // A-OK, no errors should have been thrown and internally caught, so errorMessage is falsy.
}


exports.testParseRootAndOptions_path_validStringOnly_producesDefaultMimeDetectingFunction = () => {
    const { contentTypeFunc } = lib.parseRootAndOptions("i/am/root");

    t.assertEquals("text/plain", contentTypeFunc("i/am/a/path.txt"));
    t.assertEquals("application/javascript", contentTypeFunc("i/am/a/path.js"));
    t.assertEquals("application/json", contentTypeFunc("i/am/a/path.json"));
    t.assertEquals("image/jpeg", contentTypeFunc("i/am/a/path.jpg"));
    t.assertEquals("image/gif", contentTypeFunc("i/am/a/path.gif"));
    t.assertEquals("text/html", contentTypeFunc("i/am/a/path.html"));
    t.assertEquals("text/css", contentTypeFunc("i/am/a/path.css"));
}


exports.testParseRootAndOptions_path_validStringOnly_producesDefaultCacheControlFunction = () => {
    const { cacheControlFunc } = lib.parseRootAndOptions("i/am/root");

    t.assertEquals(lib.DEFAULT_CACHE_CONTROL, cacheControlFunc("i/am/a/path.txt", "Some random content", "text/plain"));
    t.assertEquals(lib.DEFAULT_CACHE_CONTROL, cacheControlFunc("i/am/a/path.js", "Some random content", "application/javascript"));
    t.assertEquals(lib.DEFAULT_CACHE_CONTROL, cacheControlFunc("i/am/a/path.json", "Some random content", "application/javascripton"));
    t.assertEquals(lib.DEFAULT_CACHE_CONTROL, cacheControlFunc("i/am/a/path.html", "Some random content", "text/html"));
}



// Test first argument: options object with root attribute

exports.testParseRootAndOptions_optionsWithPath_validObj_extractsPath = () => {
    const {
        root,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parseRootAndOptions({root: "i/am/root"}); // Only necessary fields below

    t.assertEquals("i/am/root", root);
}

exports.testParseRootAndOptions_optionsWithPath_validObj_noEtagOverride = () => {
    const { etagOverride } = lib.parseRootAndOptions({root: "i/am/root"});

    t.assertEquals(undefined, etagOverride);
}

exports.testParseRootAndOptions_optionsWithPath_validObj_noErrorOverride = () => {
    const { throwErrors } = lib.parseRootAndOptions({root: "i/am/root"});

    t.assertFalse(!!throwErrors);
}

exports.testParseRootAndOptions_optionsWithPath_validObj_noErrorsHappened = () => {
    const { errorMessage } = lib.parseRootAndOptions({root: "i/am/root"});

    t.assertFalse(!!errorMessage); // A-OK, no errors should have been thrown, so errorMessage is falsy.
}


exports.testParseRootAndOptions_optionsWithPath_validObj_producesDefaultMimeDetectingFunction = () => {
    const { contentTypeFunc } = lib.parseRootAndOptions({root: "i/am/root"});

    t.assertEquals("text/plain", contentTypeFunc("i/am/a/path.txt"));
    t.assertEquals("application/javascript", contentTypeFunc("i/am/a/path.js"));
    t.assertEquals("application/json", contentTypeFunc("i/am/a/path.json"));
    t.assertEquals("image/jpeg", contentTypeFunc("i/am/a/path.jpg"));
    t.assertEquals("image/gif", contentTypeFunc("i/am/a/path.gif"));
    t.assertEquals("text/html", contentTypeFunc("i/am/a/path.html"));
    t.assertEquals("text/css", contentTypeFunc("i/am/a/path.css"));
}


exports.testParseRootAndOptions_optionsWithPath_validObj_producesDefaultCacheControlFunction = () => {
    const { cacheControlFunc } = lib.parseRootAndOptions({root: "i/am/root"});

    t.assertEquals(lib.DEFAULT_CACHE_CONTROL, cacheControlFunc("i/am/a/path.txt", "Some random content", "text/plain"));
    t.assertEquals(lib.DEFAULT_CACHE_CONTROL, cacheControlFunc("i/am/a/path.js", "Some random content", "application/javascript"));
    t.assertEquals(lib.DEFAULT_CACHE_CONTROL, cacheControlFunc("i/am/a/path.json", "Some random content", "application/javascripton"));
    t.assertEquals(lib.DEFAULT_CACHE_CONTROL, cacheControlFunc("i/am/a/path.html", "Some random content", "text/html"));
}

exports.testParseRootAndOptions_path_pathArg_emptyString_passThrough = () => {
    const { root, errorMessage } = lib.parseRootAndOptions("");

    t.assertEquals(undefined, errorMessage);
    t.assertEquals('', root);

    log.info("OK: " + errorMessage);
}
exports.testParseRootAndOptions_path_optionsArg_emptyString_passThrough = () => {
    const { root, errorMessage } = lib.parseRootAndOptions({root: ""});

    t.assertEquals(undefined, errorMessage);
    t.assertEquals('', root);
}

exports.testParseRootAndOptions_path_pathArg_spacesString_onlyTrim = () => {
    const { root, errorMessage } = lib.parseRootAndOptions("   ");

    t.assertEquals(undefined, errorMessage);
    t.assertEquals('', root);
}
exports.testParseRootAndOptions_path_optionsArg_spacesString_onlyTrim = () => {
    const { root, errorMessage } = lib.parseRootAndOptions({root: "  "});

    t.assertEquals(undefined, errorMessage);
    t.assertEquals('', root);
}

exports.testParseRootAndOptions_path_pathArg_pathWithSpaces_trim = () => {
    const { root, errorMessage } = lib.parseRootAndOptions(" my/root  ");

    t.assertEquals(undefined, errorMessage);
    t.assertEquals('my/root', root);
}
exports.testParseRootAndOptions_path_optionsArg_pathWithSpaces_trim = () => {
    const { root, errorMessage } = lib.parseRootAndOptions({root: "  my/root "});

    t.assertEquals(undefined, errorMessage);
    t.assertEquals('my/root', root);
}

// Provoke errors: first argument

exports.testParseRootAndOptions_fail_shouldYieldErrorMessage = () => {
    const {
        root,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parseRootAndOptions(); // Missing args should cause error message. Only necessary fields below.

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");
    log.info("OK: " + errorMessage);
}

exports.testParseRootAndOptions_fail_shouldKeepDefaultThrowErrors = () => {
    const { throwErrors, } = lib.parseRootAndOptions();

    t.assertFalse(!!throwErrors);
}
exports.testParseRootAndOptions_fail_arg1_throwErrors = () => {
    const { throwErrors, } = lib.parseRootAndOptions({throwErrors: true});

    t.assertTrue(throwErrors);
}
exports.testParseRootAndOptions_fail_arg2_throwErrors = () => {
    const { throwErrors, } = lib.parseRootAndOptions(0, {throwErrors: true});

    t.assertTrue(throwErrors);
}

exports.testParseRootAndOptions_fail_shouldEliminateOtherOutputFields = () => {
    const { root, cacheControlFunc, contentTypeFunc, etagOverride } = lib.parseRootAndOptions();

    t.assertEquals(undefined, root);
    t.assertEquals(undefined, cacheControlFunc);
    t.assertEquals(undefined, contentTypeFunc);
    t.assertEquals(undefined, etagOverride);
}

exports.testParseRootAndOptions_fail_path_array_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parseRootAndOptions(["my", "spoon", "is", "too", "big"]);

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("OK: " + errorMessage);
}
exports.testParseRootAndOptions_fail_path_array_throwError = () => {
    const { errorMessage, throwErrors } = lib.parseRootAndOptions(["my", "spoon", "is", "too", "big"], {throwErrors: true});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
}

exports.testParseRootAndOptions_fail_path_emptyArray_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parseRootAndOptions([]);

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("OK: " + errorMessage);
}
exports.testParseRootAndOptions_fail_path_emptyArray_throwError = () => {
    const { errorMessage, throwErrors } = lib.parseRootAndOptions([], {throwErrors: true});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
}

exports.testParseRootAndOptions_fail_path_boolean_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parseRootAndOptions(true);

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("OK: " + errorMessage);
}
exports.testParseRootAndOptions_fail_path_boolean_throwError = () => {
    const { errorMessage, throwErrors } = lib.parseRootAndOptions(true, {throwErrors: true});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
}

exports.testParseRootAndOptions_fail_path_number_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parseRootAndOptions(42);

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("OK: " + errorMessage);
}
exports.testParseRootAndOptions_fail_path_number_throwError = () => {
    const { errorMessage, throwErrors } = lib.parseRootAndOptions(42, {throwErrors: true});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
}

exports.testParseRootAndOptions_fail_path_zero_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parseRootAndOptions(0);

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("OK: " + errorMessage);
}
exports.testParseRootAndOptions_fail_path_zero_throwError = () => {
    const { errorMessage, throwErrors } = lib.parseRootAndOptions(0, {throwErrors: true});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
}

exports.testParseRootAndOptions_fail_path_null_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parseRootAndOptions(null);

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("OK: " + errorMessage);
}
exports.testParseRootAndOptions_fail_path_null_throwError = () => {
    const { errorMessage, throwErrors } = lib.parseRootAndOptions(null, {throwErrors: true});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
}

// Provoke errors: root as attribute in first optionsWithPath object

exports.testParseRootAndOptions_fail_pathAttribute_missing_shouldYieldErrorMessage = () => {
    const {
        root,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parseRootAndOptions({});  // Only necessary fields below

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("OK: " + errorMessage);
}
exports.testParseRootAndOptions_fail_pathAttribute_missing_shouldKeepDefaultThrowErrors = () => {
    const { throwErrors } = lib.parseRootAndOptions({});

    t.assertFalse(!!throwErrors);
}
exports.testParseRootAndOptions_fail_pathAttribute_missing_shouldEliminateOtherOutputFields = () => {
    const { root, cacheControlFunc, contentTypeFunc, etagOverride, throwErrors, errorMessage } = lib.parseRootAndOptions({});

    t.assertEquals(undefined, root);
    t.assertEquals(undefined, cacheControlFunc);
    t.assertEquals(undefined, contentTypeFunc);
    t.assertEquals(undefined, etagOverride);
}
exports.testParseRootAndOptions_fail_pathAttribute_missing_throwError = () => {
    const { errorMessage, throwErrors } = lib.parseRootAndOptions(
        {
            throwErrors: true
        }
    );

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
}

exports.testParseRootAndOptions_fail_pathAttribute_array_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parseRootAndOptions({
        root: ["my", "spoon", "is", "too", "big"]
    });

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("OK: " + errorMessage);
}
exports.testParseRootAndOptions_fail_pathAttribute_array_throwError = () => {
    const { errorMessage, throwErrors } = lib.parseRootAndOptions(
        {
            root: ["my", "spoon", "is", "too", "big"],
            throwErrors: true
        }
    );

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
}

exports.testParseRootAndOptions_fail_pathAttribute_emptyArray_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parseRootAndOptions({
        root: []
    });

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("OK: " + errorMessage);
}
exports.testParseRootAndOptions_fail_pathAttribute_emptyArray_throwError = () => {
    const { errorMessage, throwErrors } = lib.parseRootAndOptions(
        {
            root: [],
            throwErrors: true
        }
    );

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
}

exports.testParseRootAndOptions_fail_pathAttribute_boolean_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parseRootAndOptions({root: true});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("OK: " + errorMessage);
}
exports.testParseRootAndOptions_fail_pathAttribute_boolean_throwError = () => {
    const { errorMessage, throwErrors } = lib.parseRootAndOptions(
        {
            root: true,
            throwErrors: true
        }
    );

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
}

exports.testParseRootAndOptions_fail_pathAttribute_number_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parseRootAndOptions({root: 42});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("OK: " + errorMessage);
}
exports.testParseRootAndOptions_fail_pathAttribute_number_throwError = () => {
    const { errorMessage, throwErrors } = lib.parseRootAndOptions(
        {
            root: 42,
            throwErrors: true
        }
    );

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
}

exports.testParseRootAndOptions_fail_pathAttribute_zero_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parseRootAndOptions({root: 0});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("OK: " + errorMessage);
}
exports.testParseRootAndOptions_fail_pathAttribute_zero_throwError = () => {
    const { errorMessage, throwErrors } = lib.parseRootAndOptions(
        {
            root: 0,
            throwErrors: true
        }
    );

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
}

exports.testParseRootAndOptions_fail_pathAttribute_null_shouldYieldErrorMessage = () => {
    const { errorMessage } = lib.parseRootAndOptions({root: null});

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!(errorMessage.trim()), "Empty error message");

    log.info("OK: " + errorMessage);
}
exports.testParseRootAndOptions_fail_pathAttribute_null_throwError = () => {
    const { errorMessage, throwErrors } = lib.parseRootAndOptions(
        {
            root: null,
            throwErrors: true
        }
    );

    t.assertTrue('string', typeof errorMessage);
    t.assertTrue(!!errorMessage.trim());
    t.assertTrue(throwErrors);
}





// Test contentType override option

exports.testParseRootAndOptions_contentType_optionsArg2_string_producesFixedMimeDetectingFunction = () => {
    const { contentTypeFunc, errorMessage } = lib.parseRootAndOptions("i/am/root", { contentType: "fixed content type"});

    t.assertEquals(undefined, errorMessage);
    t.assertEquals("fixed content type", contentTypeFunc("i/am/a/path.txt"));
    t.assertEquals("fixed content type", contentTypeFunc("i/am/a/path.js"));
    t.assertEquals("fixed content type", contentTypeFunc("i/am/a/path.json"));
    t.assertEquals("fixed content type", contentTypeFunc("i/am/a/path.jpg"));
    t.assertEquals("fixed content type", contentTypeFunc("i/am/a/path.gif"));
    t.assertEquals("fixed content type", contentTypeFunc("i/am/a/path.html"));
    t.assertEquals("fixed content type", contentTypeFunc("i/am/a/path.css"));
}

exports.testParseRootAndOptions_contentType_optionsArg1_string_producesFixedMimeDetectingFunction = () => {
    const { contentTypeFunc, errorMessage } = lib.parseRootAndOptions({root: "i/am/root",  contentType: "fixed content type"});

    t.assertEquals(undefined, errorMessage);
    t.assertEquals("fixed content type", contentTypeFunc("i/am/a/path.txt"));
    t.assertEquals("fixed content type", contentTypeFunc("i/am/a/path.js"));
    t.assertEquals("fixed content type", contentTypeFunc("i/am/a/path.json"));
    t.assertEquals("fixed content type", contentTypeFunc("i/am/a/path.jpg"));
    t.assertEquals("fixed content type", contentTypeFunc("i/am/a/path.gif"));
    t.assertEquals("fixed content type", contentTypeFunc("i/am/a/path.html"));
    t.assertEquals("fixed content type", contentTypeFunc("i/am/a/path.css"));
}

exports.testParseRootAndOptions_contentType_optionsArg2_emptyString_disablesContentType = () => {
    const { contentTypeFunc, errorMessage } = lib.parseRootAndOptions("i/am/root",  {contentType: ""});

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.txt"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.js"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.json"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.jpg"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.gif"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.html"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.css"));
}
exports.testParseRootAndOptions_contentType_optionsArg1_emptyString_disablesContentType = () => {
    const { contentTypeFunc, errorMessage } = lib.parseRootAndOptions({root: "i/am/root",  contentType: ""});

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.txt"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.js"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.json"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.jpg"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.gif"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.html"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.css"));
}
exports.testParseRootAndOptions_contentType_optionsArg2_allSpaceString_disablesContentType = () => {
    const { contentTypeFunc, errorMessage } = lib.parseRootAndOptions("i/am/root",  {contentType: "  "});

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.txt"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.js"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.json"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.jpg"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.gif"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.html"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.css"));
}
exports.testParseRootAndOptions_contentType_optionsArg1_allSpaceString_disablesContentType = () => {
    const { contentTypeFunc, errorMessage } = lib.parseRootAndOptions({root: "i/am/root",  contentType: "  "});

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.txt"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.js"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.json"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.jpg"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.gif"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.html"));
    t.assertEquals(undefined, contentTypeFunc("i/am/a/path.css"));
}

exports.testParseRootAndOptions_contentType_optionsArg2_object_producesLookupMimeDetectingFunctionWithFallback = () => {
    const { contentTypeFunc, errorMessage } = lib.parseRootAndOptions(
        "i/am/root",
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


exports.testParseRootAndOptions_contentType_optionsArg1_object_producesLookupMimeDetectingFunctionWithFallback = () => {
    const { contentTypeFunc, errorMessage } = lib.parseRootAndOptions({
        root: "i/am/root",
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
exports.testParseRootAndOptions_contentType_optionsArg2_emptyObject_producesDefaultFunction = () => {
    const { contentTypeFunc, errorMessage } = lib.parseRootAndOptions("i/am/root", {
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
exports.testParseRootAndOptions_contentType_optionsArg1_emptyObject_producesDefaultFunction = () => {
    const { contentTypeFunc, errorMessage }  = lib.parseRootAndOptions({
        root: "i/am/root",
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
exports.testParseRootAndOptions_contentType_optionsArg2_true_producesDefaultFunction = () => {
    const { contentTypeFunc, errorMessage }  = lib.parseRootAndOptions("i/am/root", {
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
exports.testParseRootAndOptions_contentType_optionsArg1_true_producesDefaultFunction = () => {
    const { contentTypeFunc, errorMessage }  = lib.parseRootAndOptions({
        root: "i/am/root",
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



exports.testParseRootAndOptions_contentType_optionsArg2_func_replacesMimeDetectingFunctionKeepsFallback = () => {
    const { contentTypeFunc, errorMessage } = lib.parseRootAndOptions(
        "i/am/root",
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
exports.testParseRootAndOptions_contentType_optionsArg1_func_replacesMimeDetectingFunctionKeepsFallback = () => {
    const { contentTypeFunc, errorMessage } = lib.parseRootAndOptions({
        root: "i/am/root",
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


exports.testParseRootAndOptions_contentType_optionsArg2_func_mimeDetectionWithContent = () => {
    const { contentTypeFunc, errorMessage } = lib.parseRootAndOptions(
        "nevermindpath",
        {
            contentType: (path, resource) => {
                // Override for one particular content
                if (ioLib.readText(resource.getStream()) === "I am a test asset\n") {
                    return "OVERRIDDEN/TESTASSET";
                }

                // Fall back to default handling on everything else:
                return "everything/else";
            }
        });

    t.assertEquals(undefined, errorMessage);
    // Function only uses content in this case, not path

    // FIXME: ioLib.getResource can't find the files here:
    /*
    t.assertEquals("everything/else", contentTypeFunc("nevermindpath", ioLib.getResource('myapplication:static/static-test-text.txt')));
    t.assertEquals("everything/else", contentTypeFunc("nevermindpath", ioLib.getResource('myapplication:static/static-test-js.js')));
    t.assertEquals("OVERRIDDEN/TESTASSET", contentTypeFunc("nevermindpath", ioLib.getResource('myapplication:assets/asset-test-target.txt')));
    t.assertEquals("everything/else", contentTypeFunc("nevermindpath", ioLib.getResource('myapplication:static/w3c_home.gif')));
    //*/
}
exports.testParseRootAndOptions_contentType_optionsArg1_func_replacesMimeDetectingFunctionKeepsFallback = () => {
    const { contentTypeFunc, errorMessage } = lib.parseRootAndOptions(
        {
            root: "nevermindpath",
            contentType: (path, resource) => {
                // Override for one particular content
                const content = ioLib.readText(resource.getStream());
                if (content === "I am a test asset\n") {
                    return "OVERRIDDEN/TESTASSET";
                }

                // Fall back to default handling on everything else:
                return "everything/else";
            }
        });

    t.assertEquals(undefined, errorMessage);
    // Function only uses content in this case, not path

    // FIXME: ioLib.getResource can't find the files here:
    /*
    t.assertEquals("everything/else", contentTypeFunc("nevermindpath", ioLib.getResource('myapplication:static/static-test-text.txt')));
    t.assertEquals("everything/else", contentTypeFunc("nevermindpath", ioLib.getResource('myapplication:static/static-test-js.js')));
    t.assertEquals("OVERRIDDEN/TESTASSET", contentTypeFunc("nevermindpath", ioLib.getResource('myapplication:assets/asset-test-target.txt')));
    t.assertEquals("everything/else", contentTypeFunc("nevermindpath", ioLib.getResource('myapplication:static/w3c_home.gif')));
    //*/
}



// Test invalid contentTypes, should produce error message but still keep throwErrors argument

exports.testParseRootAndOptions_contentType_optionsArg2_failingShouldParseTrueThrowErrorsArg = () => {
    const result = lib.parseRootAndOptions("i/am/root", {
        contentType: 0,
        throwErrors: true
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParseRootAndOptions_contentType_optionsArg2_failingShouldParseFalseThrowErrorsArg = () => {
    const result = lib.parseRootAndOptions("i/am/root", {
        contentType: 0,
        throwErrors: false
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParseRootAndOptions_contentType_optionsArg1_failingShouldParseTrueThrowErrorsArg = () => {
    const result = lib.parseRootAndOptions({
        root: "i/am/root",
        contentType: 0,
        throwErrors: true
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(result.throwErrors, "Expected to fail but still keep throwErrors");
}


exports.testParseRootAndOptions_contentType_optionsArg2_zero_shouldFail = () => {
    const result = lib.parseRootAndOptions("i/am/root",{
        contentType: 0
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParseRootAndOptions_contentType_optionsArg1_zero_shouldFail = () => {
    const result = lib.parseRootAndOptions({
        root: "i/am/root",
        contentType: 0
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}


exports.testParseRootAndOptions_contentType_optionsArg2_number_shouldFail = () => {
    const result = lib.parseRootAndOptions("i/am/root",{
        contentType: 42
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParseRootAndOptions_contentType_optionsArg1_number_shouldFail = () => {
    const result = lib.parseRootAndOptions({
        root: "i/am/root",
        contentType: 42
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}


exports.testParseRootAndOptions_contentType_optionsArg2_emptyArray_shouldFail = () => {
    const result = lib.parseRootAndOptions("i/am/root", {
        contentType: []
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParseRootAndOptions_contentType_optionsArg1_emptyArray_shouldFail = () => {
    const result = lib.parseRootAndOptions({
        root: "i/am/root",
        contentType: []
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}


exports.testParseRootAndOptions_contentType_optionsArg2_array_shouldFail = () => {
    const result = lib.parseRootAndOptions("i/am/root", {
        contentType: ["i", "am", "groot"]
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParseRootAndOptions_contentType_optionsArg1_array_shouldFail = () => {
    const result = lib.parseRootAndOptions({
        root: "i/am/root",
        contentType: ["i", "am", "kloot"]
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}


exports.testParseRootAndOptions_contentType_optionsArg2_null_shouldFail = () => {
    const result = lib.parseRootAndOptions("i/am/root", {
        contentType: null
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParseRootAndOptions_contentType_optionsArg1_null_shouldFail = () => {
    const result = lib.parseRootAndOptions({
        root: "i/am/root",
        contentType: null
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}










// Test cacheControl override option

exports.testParseRootAndOptions_cacheControl_optionsArg2_string_producesFixedValueFunction = () => {
    const {
        root,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parseRootAndOptions("i/am/root", {
        cacheControl: "fixed cache control"
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals("fixed cache control", cacheControlFunc("i/am/a/path.txt"));
    t.assertEquals("fixed cache control", cacheControlFunc("i/am/a/path.js"));
    t.assertEquals("fixed cache control", cacheControlFunc("i/am/a/path.json"));
    t.assertEquals("fixed cache control", cacheControlFunc("i/am/a/path.jpg"));
}
exports.testParseRootAndOptions_cacheControl_optionsArg1_string_producesFixedValueFunction = () => {
    const { cacheControlFunc, errorMessage } = lib.parseRootAndOptions({
        root: "i/am/root",
        cacheControl: "fixed cache control"
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals("fixed cache control", cacheControlFunc("i/am/a/path.txt"));
    t.assertEquals("fixed cache control", cacheControlFunc("i/am/a/path.js"));
    t.assertEquals("fixed cache control", cacheControlFunc("i/am/a/path.json"));
    t.assertEquals("fixed cache control", cacheControlFunc("i/am/a/path.jpg"));
}

exports.testParseRootAndOptions_cacheControl_optionsArg2_undefined_producesDefaultValueFunction = () => {
    const { cacheControlFunc, errorMessage } = lib.parseRootAndOptions("i/am/root", {
        cacheControl: undefined
    });

    t.assertEquals(undefined, errorMessage);
    assertCacheControlIsDefault(cacheControlFunc("i/am/root", "I am some content", "text/plain"));
    assertCacheControlIsDefault(cacheControlFunc("i/am/a/path.gif", "I am some content", "image/gif"));
    assertCacheControlIsDefault(cacheControlFunc("i/am/a/path.json", "I am some content", "application.json"));
}
exports.testParseRootAndOptions_cacheControl_optionsArg1_undefined_producesDefaultValueFunction = () => {
    const { cacheControlFunc, errorMessage } = lib.parseRootAndOptions({
        root: "i/am/root"
    });

    t.assertEquals(undefined, errorMessage);
    assertCacheControlIsDefault(cacheControlFunc("i/am/root", "I am some content", "text/plain"));
    assertCacheControlIsDefault(cacheControlFunc("i/am/a/path.gif", "I am some content", "image/gif"));
    assertCacheControlIsDefault(cacheControlFunc("i/am/a/path.json", "I am some content", "application.json"));
}

exports.testParseRootAndOptions_cacheControl_optionsArg2_true_producesDefaultValueFunction = () => {
    const { cacheControlFunc, errorMessage } = lib.parseRootAndOptions("i/am/root", {
        cacheControl: true
    });

    t.assertEquals(undefined, errorMessage);
    assertCacheControlIsDefault(cacheControlFunc("i/am/root", "I am some content", "text/plain"));
    assertCacheControlIsDefault(cacheControlFunc("i/am/a/path.gif", "I am some content", "image/gif"));
    assertCacheControlIsDefault(cacheControlFunc("i/am/a/path.json", "I am some content", "application.json"));
}
exports.testParseRootAndOptions_cacheControl_optionsArg1_true_producesDefaultValueFunction = () => {
    const { cacheControlFunc, errorMessage } = lib.parseRootAndOptions({
        root: "i/am/root",
        cacheControl: true
    });

    t.assertEquals(undefined, errorMessage);
    assertCacheControlIsDefault(cacheControlFunc("i/am/root", "I am some content", "text/plain"));
    assertCacheControlIsDefault(cacheControlFunc("i/am/a/path.gif", "I am some content", "image/gif"));
    assertCacheControlIsDefault(cacheControlFunc("i/am/a/path.json", "I am some content", "application.json"));
}

exports.testParseRootAndOptions_cacheControl_optionsArg2_false_producesDefaultValueFunction = () => {
    const { cacheControlFunc, errorMessage } = lib.parseRootAndOptions("i/am/root",{
        cacheControl: false
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(undefined, cacheControlFunc("i/am/root", "I am some content", "text/plain"));
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.gif", "I am some content", "image/gif"));
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.json", "I am some content", "application.json"));
}
exports.testParseRootAndOptions_cacheControl_optionsArg1_false_producesDefaultValueFunction = () => {
    const { cacheControlFunc, errorMessage } = lib.parseRootAndOptions({
        root: "i/am/root",
        cacheControl: false
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(undefined, cacheControlFunc("i/am/root", "I am some content", "text/plain"));
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.gif", "I am some content", "image/gif"));
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.json", "I am some content", "application.json"));
}

exports.testParseRootAndOptions_cacheControl_optionsArg2_emptyString_producesDefaultValueFunction = () => {
    const { cacheControlFunc, errorMessage } = lib.parseRootAndOptions("i/am/root",{
        cacheControl: ''
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(undefined, cacheControlFunc("i/am/root", "I am some content", "text/plain"));
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.gif", "I am some content", "image/gif"));
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.json", "I am some content", "application.json"));
}
exports.testParseRootAndOptions_cacheControl_optionsArg1_emptyString_producesDefaultValueFunction = () => {
    const { cacheControlFunc, errorMessage } = lib.parseRootAndOptions({
        root: "i/am/root",
        cacheControl: ''
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(undefined, cacheControlFunc("i/am/root", "I am some content", "text/plain"));
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.gif", "I am some content", "image/gif"));
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.json", "I am some content", "application.json"));
}

exports.testParseRootAndOptions_cacheControl_optionsArg1_allSpaceString_producesDefaultValueFunction = () => {
    const { cacheControlFunc, errorMessage } = lib.parseRootAndOptions({
        root: "i/am/root",
        cacheControl: '  '
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(undefined, cacheControlFunc("i/am/root", "I am some content", "text/plain"));
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.gif", "I am some content", "image/gif"));
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.json", "I am some content", "application.json"));
}
exports.testParseRootAndOptions_cacheControl_optionsArg1_allSpaceString_producesDefaultValueFunction = () => {
    const { cacheControlFunc, errorMessage } = lib.parseRootAndOptions({
        root: "i/am/root",
        cacheControl: '  '
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(undefined, cacheControlFunc("i/am/root", "I am some content", "text/plain"));
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.gif", "I am some content", "image/gif"));
    t.assertEquals(undefined, cacheControlFunc("i/am/a/path.json", "I am some content", "application.json"));
}

exports.testParseRootAndOptions_cacheControl_optionsArg2_func_usesFunction = () => {
    const ccFunc = (path, resource, mimeType) => {
        const content = ioLib.readText(resource.getStream());
        if (content.indexOf("text") !== -1) {
            return "Special OVERRIDE text cacheControl header";
        }
        if (path.endsWith(".txt")) {
            return "Special text cacheControl header";
        }
        if (mimeType === "application/json") {
            return "Special text JSON header"
        }
        return "other";
    }

    const { cacheControlFunc, errorMessage } = lib.parseRootAndOptions("i/am/root", {
        cacheControl: ccFunc
    });

    t.assertEquals(undefined, errorMessage);

    // FIXME: ioLib.getResource can't find the files here
    /*
    t.assertEquals("Special text cacheControl header", cacheControlFunc("assets/asset-test-target.txt", ioLib.getResource("myapplication:assets/asset-test-target.txt"), "text/plain"));
    t.assertEquals("Special OVERRIDE text cacheControl header", cacheControlFunc("static/static-test-text.txt", ioLib.getResource("myapplication:static/static-test-text.txt"), "text/plain"));
    t.assertEquals("Special text JSON header", cacheControlFunc("static/static-test-js.js", ioLib.getResource("myapplication:static/static-test-js.js"), "application/json"));
    t.assertEquals("other", cacheControlFunc("static/static-test-json.json", ioLib.getResource("myapplication:static/static-test-json.json"), "application/json"));
    //*/
}
exports.testParseRootAndOptions_cacheControl_optionsArg1_func_usesFunction = () => {
    const ccFunc = (path, resource, mimeType) => {
        const content = ioLib.readText(resource.getStream());
        if (content.indexOf("text") !== -1) {
            return "Special OVERRIDE text cacheControl header";
        }
        if (path.endsWith(".txt")) {
            return "Special text cacheControl header";
        }
        if (mimeType === "application/json") {
            return "Special text JSON header"
        }
        return "other";
    }

    const { cacheControlFunc, errorMessage } = lib.parseRootAndOptions({
        root: "i/am/root",
        cacheControl: ccFunc
    });

    t.assertEquals(undefined, errorMessage);

    // FIXME: ioLib.getResource can't find the files here
    /*
    t.assertEquals("Special text cacheControl header", cacheControlFunc("assets/asset-test-target.txt", ioLib.getResource("myapplication:assets/asset-test-target.txt"), "text/plain"));
    t.assertEquals("Special OVERRIDE text cacheControl header", cacheControlFunc("static/static-test-text.txt", ioLib.getResource("myapplication:static/static-test-text.txt"), "text/plain"));
    t.assertEquals("Special text JSON header", cacheControlFunc("static/static-test-js.js", ioLib.getResource("myapplication:static/static-test-js.js"), "application/json"));
    t.assertEquals("other", cacheControlFunc("static/static-test-json.json", ioLib.getResource("myapplication:static/static-test-json.json"), "application/json"));
    //*/
}


exports.testParseRootAndOptions_cacheControl_optionsArg2_failingFunc_throwsErrorInsteadOfReturningErrorMessage = () => {
    const ccFunc = (path, content, mimeType) => {
        if (mimeType === undefined) {
            throw Error("Demonstrating a particular cacheControl function that fails if no mimeTypeis provided");
        }
    };

    const { cacheControlFunc, errorMessage } = lib.parseRootAndOptions("no/mime/type/so/testfunc/will/crash", {
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
exports.testParseRootAndOptions_cacheControl_optionsArg1_failingFunc_throwsErrorInsteadOfReturningErrorMessage = () => {
    const ccFunc = (path, content, mimeType) => {
        if (mimeType === undefined) {
            throw Error("Demonstrating a particular cacheControl function that fails if no mimeTypeis provided");
        }
    };

    const { cacheControlFunc, errorMessage } = lib.parseRootAndOptions({
        root: "no/mime/type/so/testfunc/will/crash",
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

exports.testParseRootAndOptions_cacheControl_optionsArg2_failingFunc_stillRetainsThrowErrorsParam = () => {
    const ccFunc = (path, content, mimeType) => {
        if (mimeType === undefined) {
            throw Error("Demonstrating a particular cacheControl function that fails if no mimeTypeis provided");
        }
    };

    const { cacheControlFunc, errorMessage, throwErrors } = lib.parseRootAndOptions("no/mime/type/so/testfunc/will/crash", {
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
exports.testParseRootAndOptions_cacheControl_optionsArg1_failingFunc_stillRetainsThrowErrorsParam = () => {
    const ccFunc = (path, content, mimeType) => {
        if (mimeType === undefined) {
            throw Error("Demonstrating a particular cacheControl function that fails if no mimeTypeis provided");
        }
    };

    const { cacheControlFunc, errorMessage, throwErrors } = lib.parseRootAndOptions({
        root: "no/mime/type/so/testfunc/will/crash",
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

exports.testParseRootAndOptions_cacheControl_optionsArg2_func_returnedUndefinedProducesNoCachecontrolHeader = () => {
    const ccFunc = (path, content, mimeType) => {
        if (mimeType.trim() === '') {
            return undefined; // All-space / emptystring mimeTypes
        }
    };

    const { cacheControlFunc, errorMessage } = lib.parseRootAndOptions("empty/mime/type/so/testfunc/returns/undefined", {
        cacheControl: ccFunc
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(undefined, cacheControlFunc("empty/mime/type/so/testfunc/returns/undefined", "I am some content", ""));
}
exports.testParseRootAndOptions_cacheControl_optionsArg1_func_returnedUndefinedProducesNoCachecontrolHeader = () => {
    const ccFunc = (path, content, mimeType) => {
        if (mimeType.trim() === '') {
            return undefined; // All-space / emptystring mimeTypes
        }
    };

    const { cacheControlFunc, errorMessage } = lib.parseRootAndOptions({
        root: "empty/mime/type/so/testfunc/returns/undefined",
        cacheControl: ccFunc
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(undefined, cacheControlFunc("empty/mime/type/so/testfunc/returns/undefined", "I am some content", "  "));
}

exports.testParseRootAndOptions_cacheControl_optionsArg2_func_returnedNullFallsBackToDefaultCachecontrol = () => {
    const ccFunc = (path, content, mimeType) => {
        if (mimeType.trim() === '') {
            return null; // All-space / emptystring mimeTypes
        }
    };

    const { cacheControlFunc, errorMessage } = lib.parseRootAndOptions("empty/mime/type/so/testfunc/returns/null", {
        cacheControl: ccFunc
    });

    t.assertEquals(undefined, errorMessage);
    assertCacheControlIsDefault(cacheControlFunc("empty/mime/type/so/testfunc/returns/null", "I am some content", "  "));
}
exports.testParseRootAndOptions_cacheControl_optionsArg1_func_returnedNullFallsBackToDefaultCachecontrol = () => {
    const ccFunc = (path, content, mimeType) => {
        if (mimeType.trim() === '') {
            return null; // All-space / emptystring mimeTypes
        }
    };

    const { cacheControlFunc, errorMessage } = lib.parseRootAndOptions({
        root: "empty/mime/type/so/testfunc/returns/null",
        cacheControl: ccFunc
    });

    t.assertEquals(undefined, errorMessage);
    assertCacheControlIsDefault(cacheControlFunc("no/mime/type/so/testfunc/returns/null", "I am some content", ""));
}



// Test invalid cacheControl params, should produce error message but still keep throwErrors argument

exports.testParseRootAndOptions_contentType_optionsArg2_failingShouldParseTrueThrowErrorsArg = () => {
    const result = lib.parseRootAndOptions("i/am/root", {
        cacheControl: {},
        throwErrors: true
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParseRootAndOptions_contentType_optionsArg2_failingShouldParseFalseThrowErrorsArg = () => {
    const  result = lib.parseRootAndOptions("i/am/root", {
        cacheControl: {},
        throwErrors: false
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParseRootAndOptions_contentType_optionsArg1_failingShouldParseTrueThrowErrorsArg = () => {
    const  result = lib.parseRootAndOptions({
        path: "i/am/root",
        cacheControl: {},
        throwErrors: true
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(result.throwErrors, "Expected to fail but still keep throwErrors");
}


exports.testParseRootAndOptions_contentType_optionsArg2_emptyObj_shouldFail = () => {
    const result = lib.parseRootAndOptions("i/am/root",{
        cacheControl: {},
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParseRootAndOptions_contentType_optionsArg1_emptyObj_shouldFail = () => {
    const result = lib.parseRootAndOptions({
        root: "i/am/root",
        cacheControl: {},
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}


exports.testParseRootAndOptions_contentType_optionsArg2_obj_shouldFail = () => {
    const result = lib.parseRootAndOptions("i/am/root",{
        cacheControl: {i: "object", your: "honor"},
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParseRootAndOptions_contentType_optionsArg1_obj_shouldFail = () => {
    const result = lib.parseRootAndOptions({
        root: "i/am/root",
        cacheControl: {i: "object", your: "honor"},
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}

exports.testParseRootAndOptions_contentType_optionsArg2_zero_shouldFail = () => {
    const result = lib.parseRootAndOptions("i/am/root",{
        cacheControl: 0,
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParseRootAndOptions_contentType_optionsArg1_zero_shouldFail = () => {
    const result = lib.parseRootAndOptions({
        root: "i/am/root",
        cacheControl: 0,
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}

exports.testParseRootAndOptions_contentType_optionsArg2_number_shouldFail = () => {
    const result = lib.parseRootAndOptions("i/am/root",{
        cacheControl: 42,
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParseRootAndOptions_contentType_optionsArg1_number_shouldFail = () => {
    const result = lib.parseRootAndOptions({
        root: "i/am/root",
        cacheControl: 42,
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}

exports.testParseRootAndOptions_contentType_optionsArg2_null_shouldFail = () => {
    const result = lib.parseRootAndOptions("i/am/root",{
        cacheControl: null,
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParseRootAndOptions_contentType_optionsArg1_null_shouldFail = () => {
    const result = lib.parseRootAndOptions({
        root: "i/am/root",
        cacheControl: null,
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}

exports.testParseRootAndOptions_contentType_optionsArg2_emptyArray_shouldFail = () => {
    const result = lib.parseRootAndOptions("i/am/root",{
        cacheControl: [],
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParseRootAndOptions_contentType_optionsArg1_emptyArray_shouldFail = () => {
    const result = lib.parseRootAndOptions({
        root: "i/am/root",
        cacheControl: [],
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}

exports.testParseRootAndOptions_contentType_optionsArg2_array_shouldFail = () => {
    const result = lib.parseRootAndOptions("i/am/root",{
        cacheControl: ["i", "pretend", "to", "be", "an", "object"],
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}
exports.testParseRootAndOptions_contentType_optionsArg1_array_shouldFail = () => {
    const result = lib.parseRootAndOptions({
        root: "i/am/root",
        cacheControl: ["i", "pretend", "to", "be", "an", "object"],
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
    t.assertFalse(result.throwErrors, "Expected to fail but still keep throwErrors");
}



// Test etag options

exports.testParseRootAndOptions_etag_optionsArg2_true_returnsTrue = () => {
    const {
        root,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parseRootAndOptions("i/am/root", {
        etag: true
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(true, etagOverride);
}
exports.testParseRootAndOptions_etag_optionsArg1_true_returnsTrue = () => {
    const { etagOverride, errorMessage } = lib.parseRootAndOptions({
        root: "i/am/root",
        etag: true
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(true, etagOverride);
}

exports.testParseRootAndOptions_etag_optionsArg2_false_returnsFalse = () => {
    const {
        root,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parseRootAndOptions("i/am/root", {
        etag: false
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(false, etagOverride);
}
exports.testParseRootAndOptions_etag_optionsArg1_false_returnsFalse = () => {
    const { etagOverride, errorMessage } = lib.parseRootAndOptions({
        root: "i/am/root",
        etag: false
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(false, etagOverride);
}

exports.testParseRootAndOptions_etag_optionsArg2_undefined_returnsUndefined = () => {
    const {
        root,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = lib.parseRootAndOptions("i/am/root", {
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(undefined, etagOverride);
}
exports.testParseRootAndOptions_etag_optionsArg1_undefined_returnsUndefined = () => {
    const { etagOverride, errorMessage } = lib.parseRootAndOptions({
        root: "i/am/root",
        etag: undefined
    });

    t.assertEquals(undefined, errorMessage);
    t.assertEquals(undefined, etagOverride);
}


// Test etag override error handling
exports.testParseRootAndOptions_etag_optionsArg2_null_shouldFail = () => {
    const result = lib.parseRootAndOptions("i/am/root",{
        etag: null
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}
exports.testParseRootAndOptions_etag_optionsArg1_null_shouldFail = () => {
    const result = lib.parseRootAndOptions({
        root: "i/am/root",
        etag: null
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}
exports.testParseRootAndOptions_etag_optionsArg2_null_failingShouldStillReturnThrowErrors = () => {
    const result = lib.parseRootAndOptions("i/am/root",{
        etag: null,
        throwErrors: true
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(result.throwErrors);
}
exports.testParseRootAndOptions_etag_optionsArg1_null_failingShouldStillReturnThrowErrors = () => {
    const result = lib.parseRootAndOptions({
        root: "i/am/root",
        etag: null,
        throwErrors: true
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(result.throwErrors);
}

exports.testParseRootAndOptions_etag_optionsArg2_zero_shouldFail = () => {
    const result = lib.parseRootAndOptions("i/am/root",{
        etag: 0
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}
exports.testParseRootAndOptions_etag_optionsArg1_zero_shouldFail = () => {
    const result = lib.parseRootAndOptions({
        root: "i/am/root",
        etag: 0
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}

exports.testParseRootAndOptions_etag_optionsArg2_number_shouldFail = () => {
    const result = lib.parseRootAndOptions("i/am/root",{
        etag: 42
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}
exports.testParseRootAndOptions_etag_optionsArg1_number_shouldFail = () => {
    const result = lib.parseRootAndOptions({
        root: "i/am/root",
        etag: 42
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}

exports.testParseRootAndOptions_etag_optionsArg2_emptyObject_shouldFail = () => {
    const result = lib.parseRootAndOptions("i/am/root",{
        etag: {}
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}
exports.testParseRootAndOptions_etag_optionsArg1_emptyObject_shouldFail = () => {
    const result = lib.parseRootAndOptions({
        root: "i/am/root",
        etag: {}
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}

exports.testParseRootAndOptions_etag_optionsArg2_object_shouldFail = () => {
    const result = lib.parseRootAndOptions("i/am/root",{
        etag: {i: "object"}
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}
exports.testParseRootAndOptions_etag_optionsArg1_object_shouldFail = () => {
    const result = lib.parseRootAndOptions({
        root: "i/am/root",
        etag: {i: "object"}
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}

exports.testParseRootAndOptions_etag_optionsArg2_emptyString_shouldFail = () => {
    const result = lib.parseRootAndOptions("i/am/root",{
        etag: ""
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}
exports.testParseRootAndOptions_etag_optionsArg1_emptyString_shouldFail = () => {
    const result = lib.parseRootAndOptions({
        root: "i/am/root",
        etag: ""
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}

exports.testParseRootAndOptions_etag_optionsArg2_string_shouldFail = () => {
    const result = lib.parseRootAndOptions("i/am/root",{
        etag: "I'm a string"
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}
exports.testParseRootAndOptions_etag_optionsArg1_string_shouldFail = () => {
    const result = lib.parseRootAndOptions({
        root: "i/am/root",
        etag: "I'm a string"
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}

exports.testParseRootAndOptions_etag_optionsArg2_allSpaceString_shouldFail = () => {
    const result = lib.parseRootAndOptions("i/am/root",{
        etag: "  "
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}
exports.testParseRootAndOptions_etag_optionsArg1_allSpaceString_shouldFail = () => {
    const result = lib.parseRootAndOptions({
        root: "i/am/root",
        etag: "  "
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}

exports.testParseRootAndOptions_etag_optionsArg2_emptyArray_shouldFail = () => {
    const result = lib.parseRootAndOptions("i/am/root",{
        etag: []
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}
exports.testParseRootAndOptions_etag_optionsArg1_emptyArray_shouldFail = () => {
    const result = lib.parseRootAndOptions({
        root: "i/am/root",
        etag: []
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}

exports.testParseRootAndOptions_etag_optionsArg2_array_shouldFail = () => {
    const result = lib.parseRootAndOptions("i/am/root",{
        etag: ["me", "array"]
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}
exports.testParseRootAndOptions_etag_optionsArg1_array_shouldFail = () => {
    const result = lib.parseRootAndOptions({
        root: "i/am/root",
        etag: ["you", "jane"]
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride, "Result only expected to contain errorMessage (and throwErrors, if given). Result: " + JSON.stringify(result));
}



exports.testParseRootAndOptions_getCleanPath_optionsArg2function_isOK = () => {
    const result = lib.parseRootAndOptions(
        "i/am/root",
        {
            getCleanPath: (a) => "Got " + a
        }
    );

    t.assertEquals(undefined, result.errorMessage, "errorMessage");
    t.assertEquals('function', typeof result.getCleanPath, "typeof getCleanPath");
}

exports.testParseRootAndOptions_getCleanPath_optionsArg1_function_isOK = () => {
    const result = lib.parseRootAndOptions({
        root: "i/am/root",
        getCleanPath: (a) => "Got " + a
    });

    t.assertEquals(undefined, result.errorMessage, "errorMessage");
    t.assertEquals('function', typeof result.getCleanPath, "typeof getCleanPath");
}

exports.testParseRootAndOptions_getCleanPath_optionsArg2_nonFunctionCausesErrorMessage = () => {
    const result = lib.parseRootAndOptions(
        "i/am/root",
        {
            getCleanPath: "I should only be a function"
        }
    );

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride && !result.getCleanPath, "Result only expected to contain errorMessage. Result: " + JSON.stringify(result));
}

exports.testParseRootAndOptions_getCleanPath_optionsArg1_nonFunctionCausesErrorMessage = () => {
    const result = lib.parseRootAndOptions({
        root: "i/am/root",
        getCleanPath: "I should only be a function"
    });

    t.assertTrue(!!result.errorMessage, "Expected to produce an errorMessage, but appears to be completed. Result: " + JSON.stringify(result));
    t.assertTrue(!result.root && !result.cacheControlFunc && !result.contentTypeFunc && !result.etagOverride && !result.getCleanPath, "Result only expected to contain errorMessage. Result: " + JSON.stringify(result));
}
