# lib-static

[Enonic XP](https://enonic.com/developer-tour) library for serving assets from a folder in the application resource structure. 

Intended and optimized for setting up endpoints that serve static cache optimised files, i.e. files whose content aren't meant to change. As such, developers must [version](https://cloud.google.com/cdn/docs/best-practices#versioned-urls) or [content-hash](https://survivejs.com/webpack/optimizing/adding-hashes-to-filenames/) the resource file names when updating them.

The aim is "perfect client-side and network caching" via response headers (see for example [mozilla](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching), [imagekit](https://imagekit.io/blog/ultimate-guide-to-http-caching-for-static-assets/), [freecontent.manning.com](https://freecontent.manning.com/caching-assets/)).

Modeled akin to [serve-static](https://www.npmjs.com/package/serve-static), with a simple but configurable usage.

<br/>

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
var libStatic = require('lib/enonic/static');
```

<br/>

<a name="api"></a>
## API

<a name="api-static"></a>
### .static

Sets up and returns a resource-getter function.

Can be used in three ways:

`var getStatic = libStatic.static(root);`

`var getStatic = libStatic.static(root, options);`

`var getStatic = libStatic.static(optionsWithRoot);`

The getter function `getStatic` takes the [XP request object](https://developer.enonic.com/docs/xp/stable/framework/http#http-request) as argument, and determines the asset path from that (in practice: any path after the controller's own access path is postfixed after the `root` - see below).

<a name="static-params"></a>
#### Params:
- `root` (string): path to a root folder where resources are found. This string points to a root folder in the built JAR. Using `..` in the `root` string will throw an error.
  - Note: _"a root folder in the built JAR"_ is accurate, but if you think JAR's can be a bit obscure here's an easier mental model: `root` points to a folder below and relative to the _build/resources/main_. This is where all assets are collected when building the JAR, and when running XP in [dev mode](https://developer.enonic.com/docs/enonic-cli/master/dev#start)), it actually IS where assets are served from. Depending on specific build setups, you can also think of `root` as being relative to _src/main/resources/_.
- `options` (object, optional): add an [options object](#options) after `path` to control behavior for all responses from the returned getter function.
- `optionsWithRoot` (object): same as above, an [options object](#options) but when used as the first and only argument, this object _must_ include a `{ root: ..., }` attribute too - a root string same as above. This is simply for convenience if you prefer named parameters instead of a positional `root` argument. If both are supplied, the positional `root` argument is used.

#### Example:

_getAnotherStatic.es6_ returns any asset under _/my-resources_ in the application JAR (or _build/resources/main/my-resources_ in XP dev mode).

```
var libStatic = require('lib/enonic/static');

var options = { ...some options, or not... }
var getStatic = libStatic.static('my-resources', options);

exports.get = (request) => {
    return getStatic(request);
};
```

The path to the actual asset is determined by the URL path (in the `request` object). This relative to the access URL of the controller itself. In this example, _getAnotherStatic.es6_ is accessed at `https://someDomain.com/resources/public`. That means the URL `https://someDomain.com/resources/public/subfolder/another-resource.xml` will return the static resource _build/resources/main/my-resources/subfolder/another-resource.xml_.

Same example as above, but simplified and without options:
```
var libStatic = require('lib/enonic/static');
exports.get = libStatic.static('my-resources');
```

<br/>

<a name="api-get"></a>
### .get
A specific-recource getter method, returns a [response object](#behavior) for the asset that's named in the argument string. This is similar to the getter function made by [static](#api-static) above, but with two key differences:

- There's no general behavior setup for all calls to it. There's no root folder setup, and `path` and `options` arguments apply only to each particular call.
- the `path` argument is an asset-path string instead of a request object. 
  
Of course, you probably wouldn't normally hardcode a controller to return a particular asset like in the example below. The purpose here is closer control with each call: implement your own logic and send a resulting string to the argument.

Like [static](#api-static), it be used in three ways:

`var response = libStatic.get(path);`

`var response = libStatic.get(path, options);`

`var response = libStatic.get(optionsWithPath);`

#### Params:
- `path` (string): path and full file name to an asset file, relative to the JAR root (or relative to _build/resources/main_ in XP dev mode, see [the 'root' param explanation](#static-params) above).
- `options` (object, optional): add an [options object](#options) after `path` to control behavior for this specific response.
- `optionsWithPath` (object): same as above, an [options object](#options) but when used as the first and only argument, this object _must_ include a `{ path: ..., }` attribute too - a path string same as above. This is simply for convenience if you prefer named parameters instead of a positional `path` argument. If both are supplied, the positional `path` argument is used.

#### Example:

Accessing _getMyStaticAsset.es6_ on some URL where it replies to a GET request, **specifically** returns _/public/my-folder/my-static-asset.css_ from the JAR (or _build/resources/main/public/my-folder/my-static-asset.css_ in dev mode):
```
// getMyStaticAsset.es6:

var libStatic = require('lib/enonic/static');

exports.get = (request) => { 
    return libStatic.get('public/my-folder/my-static-asset.css');
};
```


<br/>

<a name="behavior"></a>
<a name="behaviour"></a>
## Default behaviour
Unless some of these aspects are overriden by an [options parameter](#options), the returned object  is a standard [XP response object](https://developer.enonic.com/docs/xp/stable/framework/http#http-response) ready to be returned from an XP controller:

```
{ status, body, contentType, headers }
```

<a name="status"></a>
### status

Follows standard [HTTP error codes](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes), most often 200 and 404. On errors (all codes above 400), see error message in `body`.

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
    'Accept-Ranges': 'none',
    'etag': <etag_value>,
    'If-None-Match': '<etag_value>'
}
```

<br/>

<a name="options"></a>
## Overrides: options object

As described above, an object can be added with optional attributes to **override** the [default behavior](#behaviour): 

```
{ cacheControl, contentType }
```

### Params:

- `cacheControl` (string/function, optional): override the default header value (`'public, max-age=31536000, immutable'`) and return another `Cache-Control` header
  - if set as a string, always use that value
  - if set as a function: `(extension, content) => cacheControl`. Extension is the asset file name (lower-case, without dot) and content is the file content. File-by-file control. 
- `contentType` (string/object/function, optional): override the built-in MIME type handling 
  - if set as a string, assets will not be processed to try and find the MIME content type, instead this value will always be preselected and returned.
  - if set as an object, keys are file types (the extensions of the asset file names _after compilation_, case-insensitive and will ignore dots), and values are Content-Type strings - for example, `{"json": "application/json", ".mp3": "audio/mpeg", "TTF": "font/ttf"}`. For files with extensions that are not among the keys in the object, the handling will fall back to the built-in handling.
  - if set as a function: `(extension, content) => contentType`. Extension is the asset file name (lower-case, without dot) and content is the file content. Completely overrides the library's built-in MIME type handling - no fallback. 

In addition, you may supply a `path` or `root` param ([.get](#api-get) or [.static](#api-static), respectively). If a positional `path` or `root` argument is used and the options object is the second argument, then `path` or `root` parameters will be ignored in the options object. 

<br/>
<br/>
<br/>

## Later versions

### Options params
- `index` (string or array of strings): filename(s) (without path) to fall back to, look for and serve, in cases where the asset path requested is a folder. If not set, requesting a folder will yield an error.

### Response
- `'Last-Modified'` header, determined on file modified date
- `'Accept-Ranges': 'bytes'` header, handle ranges
