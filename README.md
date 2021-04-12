# Lib-static

<br/>

### Full docs:
👉 [Lib-static usage guide](README.adoc) with [API](README.adoc#api) and [examples](README.adoc#examples) 👈

<br/>

<a name="intro"></a>
### Intro

[Enonic XP](https://enonic.com/developer-tour) library for serving assets from a folder in the application resource structure. Intended for setting up XP endpoints that serve static resources from an XP app's JAR file, in a cache-optimized way. So basically the same thing as `assetUrl`, but allows you more control:

- **Caching behaviour:** With `assetUrl`, you get a URL where the current installation/version of the app is baked in as a hash. It will change whenever the app is updated, forcing browsers to skip their locally cached resources and request new ones, even if the resource wasn't changed during the update. Using lib-static with [immutable assets](README.adoc#mutable-assets) retains stable URLs and has several ways to adapt the header to direct browsers' caching behavior more effectively, even for mutable assets.
- **Endpoint URLs:** make your resource endpoints anywhere, 
- **Response headers**: override and control the MIME-type resolution, or the Cache-Control headers more specifically
- **Control resource folders:** As long as the resources are built into the app JAR, resources can be served from anywhere - even with multiple lib-static instances at once: serve from multiple specific-purpose folders, or use multi-instances to specify multiple rules from the same folder. 
  - Security issues around this are handled in the standard usage: a set root folder is required (and not at the JAR root), and URL navigation out from it is prevented. But if you still REALLY want to circumvent this, there is a lower-level API too.
- **Error handling:** 500-type errors can be set to throw instead of returning an error response - leaving the handling to you.

<br/>

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

<br/>

### Import
In any [XP controller](https://developer.enonic.com/docs/xp/stable/framework/controllers), import the library:

```javascript
const libStatic = require('/lib/enonic/static');
```


<br/>
<br/>


👉 [Lib-static usage guide](README.adoc) with [API](README.adoc#api) and [examples](README.adoc#examples) 👈
<br/>
<br/>

More relevant sources: [web.dev](https://web.dev/http-cache/), [facebook](https://engineering.fb.com/2017/01/26/web/this-browser-tweak-saved-60-of-requests-to-facebook/), [mozilla](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching), [imagekit](https://imagekit.io/blog/ultimate-guide-to-http-caching-for-static-assets/), [freecontent.manning.com](https://freecontent.manning.com/caching-assets/).

<a name="development"></a>
## Development

TODO
