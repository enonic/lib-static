# lib-static

[Enonic XP](https://enonic.com/developer-tour) library for serving assets from a folder in the application resource structure. 

Intended and optimized for setting up endpoints that serve static cache optimised files, i.e. files whose content aren't meant to change. As such, developers must [version](https://cloud.google.com/cdn/docs/best-practices#versioned-urls) or [content-hash](https://survivejs.com/webpack/optimizing/adding-hashes-to-filenames/) the resource file names when updating them.

The aim is "perfect client-side and network caching" via response headers. Some relevant sources: [web.dev](https://web.dev/http-cache/), [facebook](https://engineering.fb.com/2017/01/26/web/this-browser-tweak-saved-60-of-requests-to-facebook/), [mozilla](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching), [imagekit](https://imagekit.io/blog/ultimate-guide-to-http-caching-for-static-assets/), [freecontent.manning.com](https://freecontent.manning.com/caching-assets/).

Modelled akin to [serve-static](https://www.npmjs.com/package/serve-static), with a simple but configurable usage.


<br/>

## Contents

- [Getting started](#get-started)
  - [Install](#install)
  - [Import](#import)
- [API and examples](#api)
  - [static](#api-static)
  - [get](#api-get)
- [Response: default behaviour](#behaviour)
  - [status](#status)
  - [body](#body)
  - [contentType](#content-type)
  - [headers](#headers)
- [Overrides: the options object](#options)

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
In any XP controller, import the library:

```
const libStatic = require('lib/enonic/static');
```

<br/>
<br/>

<a name="api"></a>
## API

The API consists of two controller functions. The first, [static](#api-static) is a broad configure-once/catch-all approach that's based on the relative path in the request. The second, [get](#api-get) specifically gets an asset based on a path string and options for each particular call.

<a name="api-static"></a>
### .static

Sets up and returns a resource-getter function.

Can be used in three ways:

`const getStatic = libStatic.static(root);`

`const getStatic = libStatic.static(root, options);`

`const getStatic = libStatic.static(optionsMaybeRoot);`

The getter function `getStatic` takes the [XP request object](https://developer.enonic.com/docs/xp/stable/framework/http#http-request) as argument, determines the asset path from that, and returns a [response object](#behaviour) for the asset. In practice: any path after the controller's own access path is postfixed after the `root` - see below. If the asset path contains `..` in such a way that it points outside of `root`, an error will occur.

<a name="static-params"></a>
#### Params:
- `root` (string): path to a root folder where resources are found. This string points to a root folder in the built JAR.
    - Note: _"a root folder in the built JAR"_ is accurate, but if you think JAR's can be a bit obscure here's an easier mental model: `root` points to a folder below and relative to the _build/resources/main_. This is where all assets are collected when building the JAR. And when running XP in [dev mode](https://developer.enonic.com/docs/enonic-cli/master/dev#start), it actually IS where assets are served from. Depending on specific build setups, you can also think of `root` as being relative to _src/main/resources/_.
- `options` (object): add an [options object](#options) after `path` to control behaviour for all responses from the returned getter function.
- `optionsMaybeRoot` (object): same as above: an [options object](#options). But when used as the first and only argument, this object _must_ also include a `{ root: ..., }` attribute too - a root string same as above. This is simply for convenience if you prefer named parameters instead of a positional `root` argument. If both are supplied, the positional `root` argument is used.

If `root` (either as a string argument or as an attribute in a `options` object) contains `..`, or is missing (or just an empty string), an error is thrown.

#### Example:

_getAnyStatic.es6_ returns any asset under _/my-resources_ in the application JAR (or _build/resources/main/my-resources_ in XP dev mode).

```
// getAnyStatic.es6:

const libStatic = require('lib/enonic/static');

const options = { ...some options, or not... }
const getStatic = libStatic.static('my-resources', options);

exports.get = (request) => {
    return getStatic(request);
};
```

The path to the actual asset is determined by the URL path (in the `request` object). This relative to the access URL of the controller itself. In this example, _getAnyStatic.es6_ is accessed at `https://someDomain.com/resources/public`. That means the URL `https://someDomain.com/resources/public/subfolder/target-resource.xml` will return the static resource _/my-resources/subfolder/target-resource.xml_ from the JAR (a.k.a. _build/resources/main/my-resources/subfolder/target-resource.xml_ in dev mode).

Same example as above, but simplified and without options:
```
const libStatic = require('lib/enonic/static');
exports.get = libStatic.static('my-resources');
```

<br/>

<a name="api-get"></a>
### .get
A specific-recource getter method, returns a [response object](#behaviour) for the asset that's named in the argument string. This is similar to the getter function made by [static](#api-static) above, but with two key differences:

- There's no general behaviour setup for all calls to it. There's no root folder setup, and `path` and `options` arguments apply only to each particular call.
- the `path` argument is an asset-path string instead of a request object. 
  
Of course, you probably wouldn't normally hardcode a controller to return a particular asset like in the example below. The purpose here is closer control with each call: implement your own logic and send a resulting string to the argument.

Like [static](#api-static), it be used in three ways:

`const response = libStatic.get(path);`

`const response = libStatic.get(path, options);`

`const response = libStatic.get(optionsWithPath);`

#### Params:
- `path` (string): path and full file name to an asset file, relative to the JAR root (or relative to _build/resources/main_ in XP dev mode, see [the 'root' param explanation](#static-params) above. Difference: `path` is allowed to contain `..`, but not in such a way that it points directly to the JAR root or outside the JAR - then an error will occur).
- `options` (object, optional): add an [options object](#options) after `path` to control behaviour for this specific response.
- `optionsWithPath` (object): same as above, an [options object](#options) but when used as the first and only argument, this object _must_ include a `{ path: ..., }` attribute too - a path string same as above. This is simply for convenience if you prefer named parameters instead of a positional `path` argument. If both are supplied, the positional `path` argument is used.

#### Example:

Accessing _getSingleStatic.es6_ on some URL where it replies to a GET request, **specifically** returns _/public/my-folder/another-asset.css_ from the JAR (or _build/resources/main/public/my-folder/another-asset.css_ in dev mode):
```
// getSingleStatic.es6:

const libStatic = require('lib/enonic/static');

exports.get = (request) => { 
    return libStatic.get('public/my-folder/another-asset.css');
};
```

<br/>
<br/>

<a name="behaviour"></a>
## Response: default behaviour
Unless some of these aspects are overriden by an [options parameter](#options), the returned object from `.get` and `.static` is a standard [XP response object](https://developer.enonic.com/docs/xp/stable/framework/http#http-response) ready to be returned from an XP controller.

```
{ status, body, contentType, headers }
```

<a name="status"></a>
### status

Follows standard [HTTP error codes](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes), most often 200, 304 and 404. On errors (all codes above 400), see error message in `body`.

<a name="body"></a>
### body

Content of the requested asset, or an error message.

<a name="content-type"></a>
### contentType

[MIME type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types) string, after best-effort-automatically determining it from the requested asset. Will be `text/plain` on error messages.

<a name="headers"></a>
### headers

Headers optimized for [private browser cached](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching#private_browser_caches) resources:

```
{
    'Cache-Control': 'public, max-age=31536000, immutable',
    'ETag': <etag_value>,
}
```

<br/>

<a name="options"></a>
## Overrides: the options object

As described above, an object can be added with optional attributes to **override** the [default behaviour](#behaviour): 

```
{ cacheControl, contentType, etag }
```

### Params:

- `cacheControl` (boolean/string/function, optional): override the default header value (`'public, max-age=31536000, immutable'`) and return another `Cache-Control` header.
  - if set as a `false` boolean, no `Cache-Control` headers are sent. A `true` boolean is just ignored. 
  - if set as a string, always use that value. An empty string will act as `false` and switch off cacheControl.
  - if set as a function: `(extension, content) => cacheControl`. Extension is the asset file name (lower-case, without dot) and content is the file content. File-by-file control. 
- `contentType` (string/object/function, optional): override the built-in MIME type handling.
  - if set as a string, assets will not be processed to try and find the MIME content type, instead this value will always be preselected and returned.
  - if set as an object, keys are file types (the extensions of the asset file names _after compilation_, case-insensitive and will ignore dots), and values are Content-Type strings - for example, `{"json": "application/json", ".mp3": "audio/mpeg", "TTF": "font/ttf"}`. For files with extensions that are not among the keys in the object, the handling will fall back to the built-in handling.
  - if set as a function: `(extension, content) => contentType`. Extension is the asset file name (lower-case, without dot) and content is the file content. Completely overrides the library's built-in MIME type handling - no fallback.
- `etag` (boolean, optional): The default behavior of lib-static is to generate/handle ETag in prod, while skipping it entirely in dev mode. 
  - Setting the etag parameter to `false` will turn **off** etag processing (runtime content processing, headers and handling) in **prod** too. 
  - Setting it to `true` will turn it **on in dev mode** too. 

In addition, you may supply a `path` or `root` param ([.get](#api-get) or [.static](#api-static), respectively). If a positional `path` or `root` argument is used and the options object is the second argument, then `path` or `root` parameters will be ignored in the options object. 

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
Probably not in this lib, but worth mentioning:

To save huge complexity (detecting at buildtime what the output and unpredictable hash will be and hooking those references up to output), there should be a function that can resolve a fingerprinted asset filename at XP runtime: `resolvePath(globPath, root)`. 

For example, if a fingerprinted asset _bundle.92d34fd72.js_ is built into _/static_, then resolvePath('bundle.*.js', 'static') will look for matching files within _/static_ and return the string `"bundle.92d34fd72.js"`. We can always later add the functionality that the `globPath` argument can also be a regex pattern.
- `resolvePath` should *never* be part of an asset-serving endpoint service - i.e. it should not be possible to send a glob to the server and get a file response. Instead, it’s meant to be used in controllers to fetch the name of a required asset, e.g:
    ```
    pageContributions: <script src="${libStaticEndpoint}/${resolvePath('bundle.*.js', 'static')}">
    ```
- Besides, `resolvePath` can/should be part of a different library. Can be its own library (‘lib-resolvepath’?) or part of some other general-purpose lib, for example lib-util.
- In dev mode, `resolvePath` will often find more than one match and select the most recently updated one (and should log it at least once if that’s the case). In prod mode, it should throw an error if more than one is found, and if only one is found, cache it internally.
``
