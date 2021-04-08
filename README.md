# Lib-static


## Contents
- [Intro](#intro)
    - [Why use lib-static?](#why)
    

- [Getting started](#get-started)
    - [Install](#install)
    - [Import](#import)
    
  
- [Usage examples](#examples)
    - [Simple service](#example-service)
    - [Resource URLs](#example-urls)
    - [Options and syntax](#example-options)
    - [Path resolution on other endpoints](#example-path)
    - [A webapp with lib-router](#example-webapp)
    - [Content-type handling](#example-content)
    - [Cache-Control headers](#example-cache)
    - [ETag switch](#example-etag)
    - [Errors: throw instead of return](#example-errors)
    - [Multiple instances](#example-multi)
    - [Low-level: .get](#example-get)
    

- [API: functions](#api)
    - [static](#api-static)
    - [get](#api-get)
    

- [API: response and default behavior](#behaviour)
    - [status](#status)
    - [body](#body)
    - [contentType](#content-type)
    - [headers](#headers)
        - [Cache-Control](#headers)
        - [ETag](#headers)
    

- [API: options and overrides](#options)
    - [cacheControl](#option-cachecontrol)
    - [contentType](#option-contenttype)
    - [etag](#option-etag)
    - [getCleanPath](#option-getcleanpath)
    - [throwErrors](#option-throwerrors)
    

- [Important: assets and mutability](#mutable-assets)
    - [Headers](#mutable-headers)
    - [Implementation tips](#mutable-implementation)

<br/>
<br/>

<a name="intro"></a>
## Intro

[Enonic XP](https://enonic.com/developer-tour) library for serving assets from a folder in the application resource structure. The aim is _"perfect client-side and network caching"_ via response headers - with basic error handling included, and a simple basic usage but highly configurable (modelled akin to [serve-static](https://www.npmjs.com/package/serve-static)).

Intended for setting up XP endpoints that serve static files in a cache-optimized way. Optimally, these should be **immutable files** (files whose content aren't meant to change, that is, can be trusted to never change without changing the file name), but lib-static also handles ETags which provide caching with dynamic files too ([more about handling mutability](#mutable-assets)).

Some relevant sources: [web.dev](https://web.dev/http-cache/), [facebook](https://engineering.fb.com/2017/01/26/web/this-browser-tweak-saved-60-of-requests-to-facebook/), [mozilla](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching), [imagekit](https://imagekit.io/blog/ultimate-guide-to-http-caching-for-static-assets/), [freecontent.manning.com](https://freecontent.manning.com/caching-assets/).

<br/>

<a name="why"></a>
### Why use lib-static instead of portal.assetUrl?

Enonic XP already comes with an [asset service](https://developer.enonic.com/docs/xp/stable/runtime/engines/asset-service), where you can just put resources in the _/assets_ root folder and use `portal.assetUrl(resourcePath)` to generate URLs from where to fetch them. Lib-static basically does the same thing, but allows you more control:
- **Caching behaviour:** With `assetUrl`, you get a URL where the current installation/version of the app is baked in as a hash. It will change whenever the app is updated, forcing browsers to skip their locally cached resources and request new ones, even if the resource wasn't changed during the update. Using lib-static with [immutable assets](#mutable-assets) retains stable URLs and has several ways to adapt the header to direct browsers' caching behavior more effectively, even for mutable assets.
- **Endpoint URLs:** make your resource endpoints anywhere, 
- **Response headers**: override and control the MIME-type resolution, or the Cache-Control headers more specifically
- **Control resource folders:** As long as the resources are built into the app JAR, resources can be served from anywhere - even with multiple lib-static instances at once: serve from multiple specific-purpose folders, or use multi-instances to specify multiple rules from the same folder. 
  - Security issues around this are handled in the standard usage: a set root folder is required (and not at the JAR root), and URL navigation out from it is prevented. But if you still REALLY want to circumvent this, there is a lower-level API too.
- **Error handling:** 500-type errors can be set to throw instead of returning an error response - leaving the handling to you.

<br/>
<br/>

<a name="get-started"></a>
## Getting started

### Install
Insert into `build.gradle` of your XP project, under `dependencies`, where `<version>` is the latest/requested version of this library - for example `1.0.0`:
```groovy
dependencies {
	include 'com.enonic.lib:lib-static:<version>'
}

repositories {
    maven {
        url 'http://repo.enonic.com/public'
    }
}
```


### Import
In any [XP controller](https://developer.enonic.com/docs/xp/stable/framework/controllers), import the library:

```javascript
const libStatic = require('/lib/enonic/static');
```


<br/>
<br/>

<a name="examples"></a>
## Usage examples

<a name="example-service"></a>
### A simple service

One way to use lib-static is in an [XP service](https://developer.enonic.com/docs/xp/stable/runtime/engines/http-service), and use it to fetch the resource and serve the entire response object to the front end.

Say you have some resources under a folder _/my/folder_ in your app. Making a service serve these as resources to the frontend can be as simple as importing lib-static, using `.static` to set up a getter function, and using the getter function when serving GET requests. Let's call the service _servemyfolder_:

```javascript
// src/main/resources/services/servemyfolder/servemyfolder.js

const libStatic = require('/lib/enonic/static');

// .static sets up a new, reusable getter function: getStatic
const getStatic = libStatic.static({
    root: 'my/folder',
});

exports.get = function(request) {
    return getStatic(request);
}
```

<a name="example-service-urls"></a>
#### Resource path and URL
If this was the entire content of _src/main/resources/services/servemyfolder/servemyfolder.js_ in an app with the app name/key `my.xp.app`, then XP would respond to GET requests at the URL `**/_/service/my.xp.app/servemyfolder` (where `**` is the domain or other prefix, depending on vhosts etc. Also, using `serviceUrl('servemyfolder')` from the [portal lib](https://developer.enonic.com/docs/xp/stable/api/lib-portal#serviceurl) is recommended).

Calling `libStatic.static` returns a reusable function (`libStatic`) that takes `request` as argument. Lib-static [uses the request](#example-path) to resolve the resource path relative to the service's own URL. So when calling `**/_/service/my.xp.app/servemyfolder/some/subdir/some.file`, the resource path would be `some/subdir/some.file`. And since we initially used `root` to set up `getStatic` to look for resource files under the folder _my/folder_, it will look for _my/folder/some/subdir/some.file_.

> NOTE
>
> It's recommended to use `.static` in an [XP service controller](https://developer.enonic.com/docs/xp/stable/runtime/engines/http-service) like this. Here, routing is included and easy to handle: the endpoint's standard root path is already provided by XP in `request.contextPath`, and the asset path is automatically determined relative to that by simply subtracting `request.contextPath` from the beginning of `request.rawPath`. If you use `.static` in a context where the asset path (relative to `root`) can't be determined this way, you should add a [`getCleanPath` option parameter](#example-path).
> 
> 👉 See the [path resolution](#example-path) and [API reference](#api-static) below for more details.


#### Output
If _my/folder/some/subdir/some.file_ exists as a (readable) file, a full [XP response object](https://developer.enonic.com/docs/xp/stable/framework/http#http-response) is returned. Most importantly:

```javascript
{ 
  status: 200, 
  body: "<file content from some/subdir/some.file>"
}
```

There will also be headers for Cache-Control, ETag and contentType. If the file doesn't exist (or other circumstances), other statuses are returned: `304`, `400`, `404` and `500`. And of course, `body` can be text or binary, depending on the file and type. See [Default behaviour](#behaviour) for details.

#### Syntax variations
Above, `'my/folder'` is provided to `libStatic.static` as a named `root` attribute in a parameters object. If you prefer a simpler syntax (and don't need additional [options](#example-options)), just use a string as a first-positional argument: 

```javascript
const getStatic = libStatic.static('my/folder');
```

Also, since `getStatic` is a function that takes a `request` argument, it's directly interchangable with `exports.get`. So if you're really into one-liners, **the entire service above could be:** 

```javascript
const libStatic = require('/lib/enonic/static');
exports.get = libStatic.static('my/folder');
```

👉 [.static API reference](#api-static)

<br/>

<a name="example-urls"></a>
### Resource URLs
Once a service (or a [different endpoint](#example-path)) has been set up like this, it can serve the resources as regular assets to the frontend. An [XP webapp](https://developer.enonic.com/docs/xp/stable/runtime/engines/webapp-engine) for example just needs to resolve the base URL. In the previous example we set up the the _servemyfolder_ service, so we can just use `serviceUrl` here to call on it from a webapp, for example: 

```javascript
// src/main/resources/webapp/webapp.js:

const libPortal = require('/lib/xp/portal');

exports.get = function(req) {
    const myFolderUrl = libPortal.serviceUrl({service: 'servemyfolder'});
    
    return {
        body: `
            <html>
              <head>
                <title>It works</title>
                <link rel="stylesheet" type="text/css" href="${staticServiceUrl}/styles.css"/>
              </head>
              
              <body>
                  <h1>It works!</h1>
                  <img src="${staticServiceUrl}/logo.jpg" />
                  <script src="${staticServiceUrl}/js/myscript.js"></script>
              </body>
            </html>
        `
    };
};
```

<br/>


<a name="example-options"></a>
### Options and syntax

The behavior of the returned getter function from `.static` can be controlled with more [options](#options), in addition to the `root`.

If you set `root` with a pure string as the first argument, add a second argument object for the options. If you use the named-parameter way to set `root`, the options must be in the same first-argument object - in practice, just _never use two objects as parameters_. 

These are valid and equivalent:
```javascript
libStatic.static({
    root: 'my/folder',
    option1: "option value 1",
    option2: "option value 2"
});
```
...and:
```javascript
libStatic.static('my/folder', {
    option1: "option value 1",
    option2: "option value 2"
});
```

👉 [Options API reference](#options)

<br />

<a name="example-path"></a>
### Path resolution on other endpoints

Usually, the path to the resource file (relative to the root folder) is [determinied from the request](#example-service-urls). But this depends on several things: the request object must contain a `rawPath` and `contextPath` attribute to compare, and there must be some routing involved: the controller must be able to accept requests from sub-URIs. In [XP services](https://developer.enonic.com/docs/xp/stable/runtime/engines/http-service) (and [XP webapps](https://developer.enonic.com/docs/xp/stable/runtime/engines/webapp-engine), but with caveats) this is supported out of the box, making it easiest to use a service to implement an endpoint.

Example from a request object:
```javascript
{
  rawPath: "/_/service/my.xp.app/servemyfolder/some/subdir/some.file",
  contextPath: "/_/service/my.xp.app/servemyfolder"
}
```
From this request, the relative resource path is resolved to _some/subdir/some.file_, expected to be found below the `root` folder set with `libStatic.static`.

<a name="getCleanPath"></a>
#### getCleanPath
However, there can be cases where you need to customize the relative-asset-path resolution - for example, using an [XP controller mapping](https://developer.enonic.com/docs/xp/stable/cms/mappings) for setting up an endpoint that uses lib-static. 

Send an [option](#example-options) function `getCleanPath` to `.static`. `getCleanPath` takes the `request` argument and returns a relative asset path. The rest is up to you:

```javascript
exports.get = libStatic.static({
    root: 'my/folder', 
    getCleanPath: function(request) {
        // In a perfect imaginary example world, all requests handled here have a 
        // request.path (URL after the domain) that start with '/i/am/a/prefix`, so just
        // remove it, hardcoded, to get the correct relative path. 
        // You should probably make more of an effort though:
        return request.path.substring('/i/am/a/prefix'.length);
    }
    
    // Request path: **/i/am/a/prefix/subdir/myFile.txt 
    // --> Relative resource path: subdir/myFile.txt 
    // --> lib-static looks up my/folder/subdir/myFile.txt
});
```

...or...

```javascript
exports.get = libStatic.static({
    root: 'my/folder', 
    getCleanPath: function(request) {
        return request.params.filename + ".txt";
    }

    // Request: **/this/is/an/endpoint?filename=myFile
    // --> Relative resource path: myFile.txt 
    // --> lib-static looks up my/folder/myFile.txt
});
```

...etc.

👉 [Options API reference](#options)

<br/>

<a name="example-webapp"></a>
### A webapp with lib-router

Combining `.getCleanPath` with [lib-router](https://developer.enonic.com/docs/router-library/master) can be an easy alternative to setting up separate services the way we did above. Just let the webapp itself use lib-router to detect sub-URI's and handle the resource serving too, all from the same controller: 


```javascript
// src/main/resources/webapp/webapp.js:

const libStatic = require('/lib/enonic/static');

const libRouter = require('/lib/router')();

exports.all = function(req) {
    return libRouter.dispatch(req);
};

// Handling <webappURL>/getResource/...
libRouter.get( `/getResource/{resourcePath:.+}`, 
    libStatic.static({
        root: `'my/folder`,
        // Override relative path resolution (since request.contextPath is the root of the webapp, 
        // not <webappURL>/getResource/... which is what resource paths should be relative to).
        // Lib-router provides what we're after - everything after getResource - as 
        // request.pathParams.resourcePath, since we defined that in `/getResource/{resourcePath:.+}`:
        getCleanPath: request => request.pathParams.resourcePath
    }
));

// <webappURL> and <webappURL>/
libRouter.get( `/`, function (request) {
    return {
        body: `
            <html>
              <head>
                <title>It still works</title>
                <link   rel="stylesheet" 
                        type="text/css" 
                        href="${request.contextPath}/getResource/styles.css"
                />
              </head>
              
              <body>
                  <h1>It still works!</h1>
                  <img src="${request.contextPath}/getResource/logo.jpg" />
                  <script src="${request.contextPath}/getResource/js/myscript.js"></script>
              </body>
            </html>
            `
    };
});
```

<br/>

> NOTE
> 
> It might seem tempting to just let the links in the HTML (`${request.contextPath}/getResource/...`) start with `getResource/`. That looks neater and simpler and could just let the browser append them as relative links, and resolve its requests to `<webappURL>/getResource/...` etc. 
> 
> However, in XP, the webapp will respond to both `<webappURL>` and `<webappURL>/` - note the trailing slash, which makes the relative link behave in two different ways, only one of which is right. And adding a `/` at the beginning, `/getResource/...`, is of course no solution either, just an absolute path from the domain root.
> 
> Prefixing with `request.contextPath` solves it in this case. Your mileage may vary. 


<br/>

<a name="example-content"></a>
### Custom content type handling

By default, lib-static detects [MIME-type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) automatically. But you can use the `contentType` [option](#example-options) to override it. Either way, the result is a string returned with [the response object](#behavior).

If set as the **boolean** `false`, the detection and handling is switched off and no `Content-Type` header is returned:
```javascript
const getStatic = libStatic.static({
    root: 'my/folder',
    contentType: false // <-- Empty string does the same
});
```

If set as a (non-empty) **string**, there will be no processing, but that string will be returned as a fixed content type (a bad idea for handling multiple resource types, of course):
```javascript
const getStatic = libStatic.static({
    root: 'my/folder',
    contentType: "everything/thismimetype"
});
```

If set as an **object**, keys are file types (that is, the extensions of the requested asset file names, so beware of file extensions changing during compilation. To be clear, you want the post-compilation extension) and values are the returned MIME-type strings:
```javascript
const getStatic = libStatic.static({
    root: 'my/folder',
    contentType: {
        json: "application/json", 
        mp3: "audio/mpeg", 
        TTF: "font/ttf"
    }
});
```
For any extension not found in that object, it will fall back to automatically detecting the type, so you can override only the ones you're interested in and leave the rest.

It can also be set as a **function**: `(path, resource) => mimeTypeString?` for fine-grained control: for each circumstance, return a specific mime-type string value, or `false` to leave the `contentType` out of the response, or `null` to fall back to lib-static's built-in detection:
```javascript
const getStatic = libStatic.static({
    root: 'my/folder',
    contentType: function(path, resource) {
        if (path.endsWith('.myspoon') && resource.getSize() > 10000000) {
            return "media/toobig";
        }
        return null;
    } 
});
```

👉 [Options API reference](#options)

<br/>

<a name="example-cache"></a>
### Custom Cache-Control headers

The `cacheControl` [option](#example-options) controls the ['Cache-Control'](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control) string that's returned in the header with a successful resource fetch. The string value, if any, directs the intraction between a browser and the server on subsequent requests for the same resource. By [default](#behavior) the string `"public, max-age=31536000, immutable"` is returned, the `cacheControl` option overrides this to return a different string, or switch it off:

Setting it to the **boolean** `false` means turning the entire cache-control header off in the response:
```javascript
const getStatic = libStatic.static({
    root: 'my/folder',
    cacheControl: false
});
```

Setting it as a **string** instead, always returns that string:
```javascript
const getStatic = libStatic.static({
    root: 'my/folder',
    cacheControl: 'immutable'
});
```

It can also be set as a **function**: `(path, resource, mimeType) => cacheControlString?`, for fine-grained control. For particular circumstances, return a cache-control string for override, or `false` for leaving it out, or `null` to fall back to the default cache-control string `"public, max-age=31536000, immutable"`:

```javascript
const getStatic = libStatic.static({
    root: 'my/folder',
    cacheControl: function(path, resource, mimeType) {
        if (path.startsWith('/uncached')) {
            return false;
        }
        if (mimeType==='text/plain') {
            return "max-age=3600";
        }
        if (resource.getSize() < 100) {
            return "must-revalidate";
        }
        return null;
    } 
});
```

👉 See the [options API reference](#options) below, and [handling mutable and immutable assets](#mutable-assets), for more details.

<br/>

<a name="example-etag"></a>
### ETag switch

By [default](#behavior), an ETag is generated from the asset and sent along with the response as a header, in XP prod run mode. In XP dev mode, no ETag is generated. 

This default behavior can be overridden with the `etag` option. If set to `true`, an ETag will always be generated, even in XP dev mode. If set to `false`, no ETag is generated, even in XP prod mode:

```javascript
const getStatic = libStatic.static({
    root: 'my/folder',
    etag: false
});
```

👉 [Options API reference](#options)

<br/>

<a name="example-errors"></a>
### Errors: throw instead of return

By [default](#behavior), runtime errors during `.get` or during the returned getter function from `.static` will log the error message and return a 500-status response to the client.

If you instead want to catch these errors and handle them yourself, set a `throwErrors: true` option:

```javascript
const getStatic = libStatic.static({
    root: 'my/folder',
    throwErrors: true
});

exports.get = function(req) {
    try {
        return getStatic(req);
        
    } catch (e) {
        // handle the error...
    }
}
```

> NOTE
> 
> This only applies to status-500-type runtime errors. Bad requests (status-400 etc) will return 400 and 404 responses as usual, even if `throwErrors: true` is set.

👉 [Options API reference](#options)

<br/>

<a name="example-multi"></a>
### Multiple instances

Lib-static can be set up to respond with several instances in parallel, thereby defining different rules for different files/folders/scenarios. 

👉 [Usage example below](#separate-instances).

<br/>


<a name="example-get"></a>
### Low-level: .get

Lib-static exposes a second function `.get` (in addition to `.static`) for doing a direct resource fetch when the resource path is already known/resolved. The idea is to allow closer control with each call: implement your own logic and handling around it.

> NOTE: For most scenarios though, you'll probably want to use [`.static`](#api-static).

#### Similarities 
- Just like the getter function returned by `.static`, `.get` also returns a [full response object](#behaviour) with status, body, content type and a generated ETag, and has error detection and corresponding responses (statuses 400, 404 and 500). 
- The [options](#options) are also mostly the same.

#### Differences
`.get` is different from `.static` in these ways: 
- `.get` is intended for lower-level usage (wraps less functionality, but gives the opportunity for even more controlled usage). 
- Only one call: whereas `.static` sets up a reusable getter function, `.get` _is_ the getter function.
- No root folder is set up with `.get`. In every call, instead of the `request` argument, `.get` takes a full, absolute resource `path` (relative to JAR root) string. This allows _any valid path_ inside the JAR except the root `/` itself - including source code! **Be careful** how you resolve the `path` string in the controller to avoid security flaws, such as opening a service to reading _any file in the JAR_, etc.
- Since `.get` doesn't resolve the resource path from the request, there's no `getCleanPath` override option here.
- There is no check for matching ETag (`If-None-Match` header), and no functionality to return a body-less status 304. `.get` always tries to fetch the resource.


#### Examples

An example service _getSingleStatic.es6_ that always returns a particular asset _/public/my-folder/another-asset.css_ from the JAR:

.getSingleStatic.es6
```javascript

const libStatic = require('lib/enonic/static');    

exports.get = (request) => { 
    return libStatic.get('public/my-folder/another-asset.css');
};
```

This is equivalent with using the `path` attribute:

```javascript
    // ... 

    return libStatic.get({
        path: 'public/my-folder/another-asset.css'
    });

    // ...
```

It's also open to the same [options](#options) as `.static` - except for `getCleanPath` which doesn't exist for `.get`:

```javascript
    // ...

    return libStatic.get('public/my-folder/another-asset.css',
        {
            // ... options ...
        }
    );

    // OR if you prefer:

    return libStatic.get(
        {
            path: 'public/my-folder/another-asset.css',
            // ... more options ...
        }
    );
    
    // ...
```

👉 [.get API reference](#api-get)

<br/>
<br/>
<br/>

<a name="api"></a>
## API: functions

Two controller functions are exposed. 
- The first, [static](#api-static), is a broad configure-once/catch-all approach that's based on the relative path in the request. This is the one you usually want.
- The second, [get](#api-get), specifically gets an asset based on a path string and options for each particular call.

👉 [Similarities and differences](#example-get)


<br />

<a name="api-static"></a>
### .static

Sets up and returns a reusable resource-getter function.

Can be used in three ways:

`const getStatic = libStatic.static(root);`

`const getStatic = libStatic.static(root, options);`

`const getStatic = libStatic.static(optionsWithRoot);`

The getter function (`getStatic`) takes the [XP request object](https://developer.enonic.com/docs/xp/stable/framework/http#http-request) as argument, determines the asset path from that, and returns a [response object](#behaviour) for the asset:

`const response = getStatic(reques);`

<a name="static-params"></a>
#### Params:
- `root` (string): path to a root folder where resources are found. This string points to a root folder in the built JAR.
    > NOTE: The phrase _"a root folder in the built JAR"_ is accurate, but if you think JAR's can be a bit obscure here's an easier mental model: `root` points to a folder below and relative to the _build/resources/main_. This is where all assets are collected when building the JAR. And when running XP in [dev mode](https://developer.enonic.com/docs/enonic-cli/master/dev#start), it actually IS where assets are served from. Depending on specific build setups, you can also think of `root` as being relative to _src/main/resources/_.
- `options` (object): add an [options object](#options) after `path` to control behaviour for all responses from the returned getter function.
- `optionsWithRoot` (object): same as above: an [options object](#options). But when used as the first and only argument, this object _must_ also include a `{ root: ..., }` attribute too - a root string same as above. This is simply for convenience if you prefer named parameters instead of a positional `root` argument. If both are supplied, the positional `root` argument is used.

If `root` (either as a string argument or as an attribute in a `options` object) resolves to (or outside) the JAR root, contains `..` or any of the characters `: | < > ' " ´ * ?` or backslash or backtick, or is missing or empty, an error is thrown.

Again, you need to call the returned getter function to actually get a response. 

👉 [Usage examples](#example-service)

<br/>

<a name="api-get"></a>
### .get
A specific-recource getter method, returns a [response object](#behaviour) for the particular asset that's named in the argument string. 

Three optional and equivalent syntaxes:

`const response = libStatic.get(path);`

`const response = libStatic.get(path, options);`

`const response = libStatic.get(optionsWithPath);`


#### Params:
- `path` (string): path and full file name to an asset file, relative to the JAR root (or relative to _build/resources/main_ in XP dev mode, see [the 'root' param explanation](#static-params) above. Cannot contain `..` or any of the characters `: | < > ' " ´ * ?` or backslash or backtick.
- `options` (object): add an [options object](#options) after `path` to control behaviour for this specific response.
- `optionsWithPath` (object): same as above, an [options object](#options) but when used as the first and only argument, this object _must_ include a `{ path: ..., }` attribute too - a path string same as above. This is simply for convenience if you prefer named parameters instead of a positional `path` argument. If both are supplied, the positional `path` argument is used.

If `path` (either as a string argument or as an attribute in a `options` object) resolves to (or outside) the JAR root, contains `..` or any of the characters `: | < > ' " ´ * ?` or backslash or backtick, or is missing or empty, an error is thrown.

👉 [Usage examples](#example-get)


<br/>
<br/>
<br/>

<a name="behaviour"></a>
## API: response and default behaviour
Unless some of these aspects are overriden by an [options parameter](#options), the returned object (from both `.get` and the getter function created by `.static`) is a standard [XP response object](https://developer.enonic.com/docs/xp/stable/framework/http#http-response) ready to be returned from an XP controller.

**Response signature:**

```
{ status, body, contentType, headers }
```
<a name="status"></a>
#### status

Follows standard [HTTP error codes](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes), most often 200, 304 and 404. On errors (all codes above 400), see error message in `body`.

<a name="body"></a>
#### body

Content of the requested asset, or an error message. 

When returning a resource, this content is not a string but a **resource stream** from [ioLib](https://developer.enonic.com/docs/xp/stable/api/lib-io) (see resource.getStream). This works seamlessly for returning both binary and non-binary files in the response directly to browsers. But might be less straightforward when writing tests or otherwise intercepting the output.


<a name="content-type"></a>
#### contentType

[MIME type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types) string, after best-effort-automatically determining it from the requested asset. Will be `text/plain` on error messages.

<a name="headers"></a>
#### headers

**Default headers** optimized for immutable and [browser cached](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching#private_browser_caches) resources:

```
{
    'Cache-Control': 'public, max-age=31536000, immutable',
    'ETag': <etag_value>,
}
```

<br/>

> NOTE: Mutable assets should not be served with this header! See [below](#mutable-headers).




<br/>
<br/>
<br/>

<a name="options"></a>
## API: options and overrides

As described above, an options object can be added with optional attributes to **override** the [default behaviour](#behaviour):

```
{ cacheControl, contentType, etag, getCleanPath, throwErrors }
```

<a name="option-cachecontrol"></a>
#### cacheControl

- `cacheControl` (boolean/string/function): override the default header value (`'public, max-age=31536000, immutable'`) and return another `Cache-Control` header.
    - if set as a `false` boolean, no `Cache-Control` headers are sent. A `true` boolean is just ignored.
    - if set as a string, always use that value. An empty string will act as `false` and switch off cacheControl.
    - if set as a function: `(filePathAndName, resource, mimeType) => cacheControl`. For fine-grained control which can use resource path, resolved MIMEtype string, or file content if needed. _filePathAndName_ is the asset's file path and name (relative to the JAR root, or `build/resources/main/` in dev mode). File content is by resource object: _resource_ is the output from [ioLib getResource](https://developer.enonic.com/docs/xp/stable/api/lib-io#getresource), so your function should handle this if used. This function and the string it returns is meant to replace the default header handling, but here's a trick if needed: anytime the function returns `null`, lib-static's default Cache-Control header is used instead. The output _cacheControl_ string is used in response `headers: { 'Cache-Control': <cacheControl> }`

<a name="option-contenttype"></a>
#### contentType

- `contentType` (string/boolean/object/function): override the built-in MIME type handling.
    - if set as a boolean, switches MIME type handling on/off. `true` is basically ignored (keep using built-in type detection), `false` skips processing and removes the content-type header (same as an empty string)  
    - if set as a non-empty string, assets will not be processed to try and find the MIME content type. Instead this value will always be preselected and returned.
    - if set as an object, keys are file types (the extensions of the asset file names _after compilation_, case-insensitive and will ignore dots), and values are Content-Type strings - for example, `{"json": "application/json", ".mp3": "audio/mpeg", "TTF": "font/ttf"}`. For files with extensions that are not among the keys in the object, the handling will fall back to the built-in handling.
    - if set as a function: `(filePathAndName, resource) => contentType`. _filePathAndName_ is the asset file path and name (relative to the JAR root, or `build/resources/main/` in dev mode). File content is by resource object: _resource_ is the output from [ioLib getResource](https://developer.enonic.com/docs/xp/stable/api/lib-io#getresource), so your function should handle this if used. Same trick as for the _cacheControl_ function above: in cases where the function returns `null`, the processing falls back to the built-in contentType detection.

<a name="option-etag"></a>
#### etag

- `etag` (boolean): The default behavior of lib-static is to generate/handle ETag in prod, while skipping it entirely in dev mode.
    - Setting the etag parameter to `false` will turn **off** etag processing (runtime content processing, headers and handling) in **prod** too.
    - Setting it to `true` will turn it **on in dev mode** too.

<a name="option-getcleanpath"></a>
#### getCleanPath

- `getCleanPath` (function): Only used in [.static](#api-static). The default behavior of the returned `getStatic` function is to take a request object, and compare the beginning of the current requested path (`request.rawPath`) to the endpoint's own root path (`request.contextPath`) and get a relative asset path below `root` (so that later, prefixing the `root` value to that relative path will give the absolute full path to the resource in the JAR). In cases where this default behavior is not enough, you can override it by adding a `getCleanPath` param: `(request) => 'resource/path/below/root'`. Emphasis: the returned 'clean' path from this function should be _relative to the `root` folder_, not an absolute path in the JAR.
    - **For example:** if _getAnyStatic.es6_ is accessed with a [controller mapping](https://developer.enonic.com/docs/xp/stable/cms/mappings) at `https://someDomain.com/resources/public`, then that's an endpoint with the path `resources/public` - but that can't be determined from the request. So the automatic extraction of a relative path needs a `getCleanPath` override. Very simplified here:
    ```
    const getStatic = libStatic.static(
        'my-resources', 
        { 
            getCleanPath: (request) => {
                if (!resource.rawPath.startsWith('resources/public') { throw Error('Ooops'); }
                return resource.rawPath.substring('resources/public'.length);
            }
        }
    );
    ```
    - Now, since `request.rawPath` doesn't include the protocol or domain, the URL `https://someDomain.com/resources/public/subfolder/target-resource.xml` will make `getCleanPath` return `/subfolder/target-resource.xml`, which together with `root` will look up the resource _/my-resources/subfolder/target-resource.xml_ in the JAR (a.k.a. _build/resources/main/my-resources/subfolder/target-resource.xml_ in dev mode).

<a name="option-throwerrors"></a>
#### throwErrors

- `throwErrors` (boolean): by default (`false`), the `.get` method should not throw errors when used correctly. Instead, it internally server-logs (and hash-ID-tags) errors and automatically outputs a 500 error response. 
  - Setting `throwErrors` to `true` overrides this: the 500-response generation is skipped, and the error is re-thrown down to the calling context, to be handled there. 
  - This does not apply to 400-bad-request and 404-not-found type "errors", they will always generate a 404-response either way. 200 and 304 are also untouched, of course.



<br/>    
<br/>
<br/>

<a name="mutable-assets"></a>
## Important: assets and mutability

**Immutable assets**, in our context, are files whose content can be _trusted to never change_ without changing the file name. To ensure this, developers should adapt their build setup to [content-hash](https://survivejs.com/webpack/optimizing/adding-hashes-to-filenames/) (or at least [version](https://cloud.google.com/cdn/docs/best-practices#versioned-urls)) the resource file names when updating them. Many build toolchains can do this automatically, for example Webpack.

**Mutable assets** on the other hand are any files whose content _may_ change and still keep the same filename/path/URL. 

<a name="mutable-headers"></a>
### Headers
**Mutable assets should never be served wtih the default header** `'Cache-Control': 'public, max-age=31536000, immutable'`. That header basically aims to make a browser never contact the server again for that asset, until the URL changes (although caveats exist to this). If an asset is served with that `immutable` header and later changes content but keeps its name/path, everyone who's downloaded it before will have - and to a large extent _keep_ - an outdated version of the asset! 

Mutable assets _can_ be handled by this library (since ETag support is in place by default), but they **should be given a different Cache-Control header**. This is up to you:

A balanced Cache-Control header, that still limits the number of requests to the server but also allows an asset to be stale for maximum an hour (3600 seconds) (remember that etag headers are still needed besides this):

```javascript
{
    'Cache-Control': 'public, max-age=3600',
}
```

A more aggressive approach, that makes browsers check the asset's freshness with the server, could be: 

```javascript
{
    'Cache-Control': 'must-revalidate',
}
```

In this last case, if the content hasn't changed, a simple 304 status code is returned by `.static` and `.get`, with nothing in the body - so nothing will be downloaded.

<a name="mutable-implementation"></a>
### Implementation
If you have mutable assets in your project, there are several ways you could implement the appropriate `Cache-Control` header with the lib-static library. Three approaches that can be combined or independent:

1. **Fingerprint all your assets** so that that updated files get a new, uniquely _content-dependent filename_ - ensuring that are all actually immutable. 
    - The most common way: set the build pipeline up so that the file name depends on the content. Webpack can fairly easily [add a content hash to the file name](https://webpack.js.org/guides/caching/), for example: _staticAssets/bundle.3a01c73e29.js_ etc. This is a reliable form of fingerprinting, with the advantage that unchanged files will keep their path and name and hence keep the client-cache intact, even if the XP app is updated and versioned. The disadvantage is that the file names are now dynamic (generated during the build) and harder to predict when writing calls from the code. Working around that is not the easiest, but one way is to export the resulting build stats from webpack and fetch file names at runtime, for example with [stats-webpack-plugin](https://www.npmjs.com/package/stats-webpack-plugin).
    - Another approach is to add version strings to file names, a timestamp etc. 
    - Or if you build assets to a subfolder named after the XP app's version, an XP controller can easily refer to them, e.g.: `"staticAssets/" + app.version + "/myFile.txt`. The disadvantage here: client-caching now depends on correct (and manual?) versioning. Every time the version is updated, all clients lose their cached assets, even unchanged ones. And worse, if a new version is deployed erroneously without changing the version string, assets may have changed without the path changing - leading to stale cache.   
    
<br /><a name="separate-instances"></a>
    
2. **Separate between mutable and immutable assets** in _two different directories_. Then you can set up asset serving separately. Immutable assets could use lib-static in the default ways. For the mutable assets...
    - you can simply serve them from _/assets with [portal.assetUrl](https://developer.enonic.com/docs/xp/stable/api/lib-portal#asseturl),
    - or you could serve mutable assets from any custom directory, with a _separate instance_ of lib-static. A combined example:
    ```javascript
    const libStatic = require('lib/enonic/static');
    
    // Root: /immutable folder. Only immutable assets there, since they are served with immutable-optimized header by default!
    const getImmutableAsset = libStatic.static('immutable');      
    
    const getMutableAsset = libStatic.static(
    
        // Root: /mutable folder. Any assets can be under there...
        'mutable',                            
    
        // ...because the options object overrides the Cache-Control header (and only that - etag is preserved, importantly):
        {
            cacheControl: 'must-revalidate'
        }
    );
    ```
    
<br />

3. It's also possible to handle mutable vs immutable assets differently _from the same directory_, if you know you can distinguish immutable files from mutable ones by some pattern, by using a **function for the `cacheControl` option**. For example, if only immutable files are fingerprinted by the pattern `someName.[base-16-hash].ext` and others are not:
    ```javascript
    const libStatic = require('lib/enonic/static');
  
    // Reliable static-filename regex pattern in this case:
    const immutablePattern = /\w+\.[0-9a-fA-F].\w+$/;
  
    const getStaticAsset = libStatic.static(
  
        // Root: /static contains both immutable and mutable files: 
        'static',
  
        {
            cacheControl: (filePathAndName, content) => {
                if (filePathAndName.match(immutablePattern)) {
                    // fingerprinted file, ergo static:
                    return 'public, max-age=31536000, immutable';
                } else {
                    // mutable file:
                    return 'Cache-Control': 'public, max-age=3600';
                }
            }
        }
    );      
    ```






<br/>
<br/>
<br/>

## TODO: Later versions

### Options params
- `index` (string or array of strings): filename(s) (without path) to fall back to, look for and serve, in cases where the asset path requested is a folder. If not set, requesting a folder will yield an error. Implementaion: before throwing a 404, check if postfixing any of the chosen /index files (with the slash) resolves it. If so, return that.
  The rest is up to the developer, and their responsibility how it's used: what htm/html/other they explicitly add in this parameter. And cache headers, just same as if they had asked directly for the index file.

### Response
- `'Last-Modified'` header, determined on file modified date
- `'Accept-Ranges': 'bytes'` header. Implement range handling.

### .resolvePath(globPath, root)
Probably not in this lib? Worth mentioning though:

To save huge complexity (detecting at buildtime what the output and unpredictable hash will be and hooking those references up to output), there should be a function that can resolve a fingerprinted asset filename at XP runtime: `resolvePath(globPath, root)`. 

For example, if a fingerprinted asset _bundle.92d34fd72.js_ is built into _/static_, then resolvePath('bundle.*.js', 'static') will look for matching files within _/static_ and return the string `"bundle.92d34fd72.js"`. We can always later add the functionality that the `globPath` argument can also be a regex pattern.
- `resolvePath` should *never* be part of an asset-serving endpoint service - i.e. it should not be possible to send a glob to the server and get a file response. Instead, it’s meant to be used in controllers to fetch the name of a required asset, e.g:
    ```
    pageContributions: <script src="${libStaticEndpoint}/${resolvePath('bundle.*.js', 'static')}">
    ```
- Besides, `resolvePath` can/should be part of a different library. Can be its own library (‘lib-resolvepath’?) or part of some other general-purpose lib, for example lib-util.
- In dev mode, `resolvePath` will often find more than one match and select the most recently updated one (and should log it at least once if that’s the case). In prod mode, it should throw an error if more than one is found, and if only one is found, cache it internally.
``
