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

<a name="api-get"></a>
### .get
Shorthand all-in-one method, returns a [response object](#behavior).

Can be used in three ways:

`var response = libStatic.get(path);`

`var response = libStatic.get(path, options);`

`var response = libStatic.get(optionsWithPath);`

#### Params:
- `path` (string): path and full file name to an asset resource, relative to _build/resources/main_ in the [XP project structure](https://developer.enonic.com/docs/xp/stable/apps/projects#project_structure) after building (depending on specific build setups, this is somewhat equivalent to a path relative to _src/main/resources/_).
- `options` (object, optional): add an [options object](#options) after `path` to control behavior for this specific response.
- `optionsWithPath` (object): same as above, an [options object](#options) but when used as the first and only argument, this object _must_ include a `path: ...` attribute too - a path string same as above. This is simply for convenience if you prefer named parameters instead of a positional `path` argument.

#### Example:

Accessing _getMyStaticAsset.es6_ on some URL where it replies to a GET request, specifically returns _build/resources/main/public/my-folder/my-static-asset.css_:
```
// getMyStaticAsset.es6:

var libStatic = require('lib/enonic/static');

exports.get = (request) => { 
    return libStatic.get('public/my-folder/my-static-asset.css');
};
```

<br/>

<a name="api-static"></a>
### .static

Sets up and returns a resource getter function, similar to [get](#api-get) but with two key differences:

- customized behavior with `root` and `options` applies to all calls with the getter function,
- the getter function takes the [XP request object](https://developer.enonic.com/docs/xp/stable/framework/http#http-request) as argument and determines the asset path from that (with the path relative to , relative to the root.

The setup is analog to [get](#api-get):

`var getStatic = libStatic.static(root);`

`var getStatic = libStatic.static(root, options);`

`var getStatic = libStatic.static(optionsWithRoot);`

#### Params:
- `root` (string): path to a root folder where resources are found. The root folder is relative to _build/resources/main_ in the [XP project structure](https://developer.enonic.com/docs/xp/stable/apps/projects#project_structure) after building (depending on specific build setups, this is somewhat equivalent to a path relative to _src/main/resources/_).
- `options` (object, optional): add an [options object](#options) after `path` to control behavior for all responses from the returned getter function.
- `optionsWithRoot` (object): same as above, an [options object](#options) but when used as the first and only argument, this object _must_ include a `root: ...` attribute too - a root string same as above. This is simply for convenience if you prefer named parameters instead of a positional `path` argument.

#### Example:

_getAnotherStatic.es6_ returns any asset under _build/resources/main/my-resources/_, determined by the URL path relative to the controller itself:

```
var libStatic = require('lib/enonic/static');

var getStatic = libStatic.static('my-resources');

exports.get = (request) => { 
    return getStatic(request);
};
```

In this example, _getAnotherStatic.es6_ is accessed at `https://someDomain.com/resources/public`.

That means the URL `https://someDomain.com/resources/public/subfolder/another-resource.xml` will return the static resource _build/resources/main/my-resources/subfolder/another-resource.xml_.


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
    'Cache-Control': 'public, max-age=31536000',
    'Accept-Ranges': 'none'
}
```

<br/>

<a name="options"></a>
## Overrides: options object

As described above, an object can be added with optional attributes to **override** the [default behavior](#behaviour): 

```
{ cacheControl, index, contentType }
```

### Params:

- `cacheControl` (string, optional): if set, overrides the default `'public, max-age=31536000'` header value.
- `index` (string or array of strings): filename(s) (without path) to fall back to, look for and serve, in cases where the asset path requested is a folder. If not set, requesting a folder will yield an error.
- `contentType` (string, optional): if set, assets will not be processed to try and find the MIME content type, instead this value will be preselected and returned.

In addition, you may supply a `path` or `root` param ([.get](#api-get) or [.static](#api-static), respectively). If a positional `path` or `root` argument is used and the options object is the second argument, then `path` or `root` parameters will be ignored in the options object. 

<br/>
<br/>
<br/>

## Later versions:

- `lastModified`: true/false. Generate 'Last-Modified' header, (determined on file modified date)
- `etag`: true/false. Generate etags (determined by file modified date updates?)
- `acceptRanges` (string) Support ranges

