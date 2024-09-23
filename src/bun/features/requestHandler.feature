Feature: requestHandler

Background: State is reset before each test
  Given the parameters are reset

Scenario: Responds with 200 ok when resource found
  Given enonic xp is running in production mode
  Given the following resources:
    | path                        | exist | type     | etag           | content               |
    | /static/index.css           | true  | text/css | etag-index-css | body { color: green } |
  And the following request:
    | property    | value                                                                                               |
    | contextPath | /webapp/com.example.myproject/_/service/com.example.myproject/static                                |
    | rawPath     | /webapp/com.example.myproject/_/service/com.example.myproject/static/index.css                      |
    | url         | http://localhost:8080/webapp/com.example.myproject/_/service/com.example.myproject/static/index.css |
  # When the resources are info logged
  # When the request is info logged
  When requestHandler is called
  # Then the response is info logged
  Then the response should have the following properties:
    | property    | value                 |
    | body        | body { color: green } |
    | status      | 200                   |
    | contentType | text/css              |
  And the response should have the following headers:
    | header        | value                               |
    | etag          | "etag-index-css"                    |
    | cache-control | public, max-age=31536000, immutable |

Scenario: Responds with 200 ok when index is enabled, rawPath has trailing slash
  Given enonic xp is running in production mode
  Given the following resources:
    | path                      | exist | type      | content       | etag            |
    | /static/folder/index.html | true  | text/html | <html></html> | etag-index-html |
    | /static/folder            | true  |           |               |                 |
  And the following request:
    | property    | value                                                                        |
    | contextPath | /webapp/com.example.myproject/_/service/com.example.myproject/static         |
    | rawPath     | /webapp/com.example.myproject/_/service/com.example.myproject/static/folder/ |
    | path        | /webapp/com.example.myproject/_/service/com.example.myproject/static/folder/ |
  # When the resources are info logged
  When requestHandler is called
  # And the response is info logged
  Then the response should have the following properties:
    | property    | value         |
    | status      | 200           |
    | contentType | text/html     |
    | body        | <html></html> |
  Then the response should have the following headers:
    | header        | value                              |
    | cache-control | public, max-age=0, must-revalidate |
    | etag          | "etag-index-html"                  |

Scenario: prefers brotli even though it comes last and have lowest qvalue weight
  Given enonic xp is running in production mode
  Given the following resources:
    | path                 | exist | mimeType | content               | etag                         |
    | /static/index.css    | true  | text/css | body { color: green } | etag-index-css               |
    | /static/index.css.br | true  | text/css | brContent             | br-etag-should-not-be-used   |
    | /static/index.css.gz | true  | text/css | gzipContent           | gzip-etag-should-not-be-used |
  And the following request:
    | property    | value                                                                          |
    | contextPath | /webapp/com.example.myproject/_/service/com.example.myproject/static           |
    | rawPath     | /webapp/com.example.myproject/_/service/com.example.myproject/static/index.css |
  And the following request headers:
    | header           | value                                                  |
    | accept-encoding  | gzip, deflate;q=0.9, identity;q=0.8, *;q=0.7, br;q=0.1 |
  When requestHandler is called
  Then the response should have the following properties:
    | property    | value     |
    | body        | brContent |
    | status      | 200       |
    | contentType | text/css  |
  And the response should have the following headers:
    | header           | value                               |
    | cache-control    | public, max-age=31536000, immutable |
    | content-encoding | br                                  |
    | etag             | "etag-index-css-br"                 |
    | vary             | Accept-Encoding                     |

Scenario: returns gzip compressed content gzip, but no brotli in accept-encoding header
  Given enonic xp is running in production mode
  Given the following resources:
    | path                 | exist | mimeType | content               | etag                         |
    | /static/index.css    | true  | text/css | body { color: green } | etag-index-css               |
    | /static/index.css.br | true  | text/css | brContent             | br-etag-should-not-be-used   |
    | /static/index.css.gz | true  | text/css | gzipContent           | gzip-etag-should-not-be-used |
  And the following request:
    | property    | value                                                                          |
    | contextPath | /webapp/com.example.myproject/_/service/com.example.myproject/static           |
    | rawPath     | /webapp/com.example.myproject/_/service/com.example.myproject/static/index.css |
  And the following request headers:
    | header           | value                                            |
    | accept-encoding  | deflate;q=1.0, identity;q=0.9, *;q=0.8, gzip=0.1 |
  When requestHandler is called
  Then the response should have the following properties:
    | property    | value       |
    | body        | gzipContent |
    | status      | 200         |
    | contentType | text/css    |
  And the response should have the following headers:
    | header           | value                               |
    | cache-control    | public, max-age=31536000, immutable |
    | content-encoding | gzip                                |
    | etag             | "etag-index-css-gzip"               |
    | vary             | Accept-Encoding                     |

Scenario: returns gzip when br file is missing
  Given enonic xp is running in production mode
  Given the following resources:
    | path                 | exist | mimeType | content               | etag                         |
    | /static/index.css    | true  | text/css | body { color: green } | etag-index-css               |
    | /static/index.css.br | false |          |                       |                              |
    | /static/index.css.gz | true  | text/css | gzipContent           | gzip-etag-should-not-be-used |
  And the following request:
    | property    | value                                                                          |
    | contextPath | /webapp/com.example.myproject/_/service/com.example.myproject/static           |
    | rawPath     | /webapp/com.example.myproject/_/service/com.example.myproject/static/index.css |
  And the following request headers:
    | header           | value                                                        |
    | accept-encoding  | br;q=1.0, gzip;q=0.1, deflate;q=0.6, identity;q=0.4, *;q=0.2 |
  When requestHandler is called
  Then the response should have the following properties:
    | property    | value       |
    | body        | gzipContent |
    | status      | 200         |
    | contentType | text/css    |
  And the response should have the following headers:
    | header           | value                               |
    | cache-control    | public, max-age=31536000, immutable |
    | content-encoding | gzip                                |
    | etag             | "etag-index-css-gzip"               |
    | vary             | Accept-Encoding                     |

Scenario: Does NOT set vary when staticCompress = false
  # Running in development mode to avoid cached configuration
  Given enonic xp is running in production mode
  And the following resources:
    | path                 | exist | mimeType | content               | etag                         |
    | /static/index.css    | true  | text/css | body { color: green } | etag-index-css               |
    | /static/index.css.br | true  | text/css | brContent             | br-etag-should-not-be-used   |
    | /static/index.css.gz | true  | text/css | gzipContent           | gzip-etag-should-not-be-used |
  And the following request:
    | property    | value                                                                          |
    | contextPath | /webapp/com.example.myproject/_/service/com.example.myproject/static           |
    | rawPath     | /webapp/com.example.myproject/_/service/com.example.myproject/static/index.css |
  And the following request headers:
    | header           | value                          |
    | accept-encoding  | br, gzip, deflate, identity, * |
  When requestHandler is called with the following parameters:
    | param          | value |
    | staticCompress | false |
  Then the response should have the following properties:
    | property    | value                 |
    | body        | body { color: green } |
    | status      | 200                   |
    | contentType | text/css              |
  And the response should have the following headers:
    | header           | value                               |
    | cache-control    | public, max-age=31536000, immutable |
    | content-encoding | undefined                           |
    | etag             | "etag-index-css"                    |
    | vary             | undefined                           |

Scenario: Does not use compression when trimmed accept-encoding endswith gzip;q=0 and includes br;q=0,
  Given enonic xp is running in production mode
  Given the following resources:
    | path                 | exist | mimeType | content               | etag                         |
    | /static/index.css    | true  | text/css | body { color: green } | etag-index-css               |
    | /static/index.css.br | true  | text/css | brContent             | br-etag-should-not-be-used   |
    | /static/index.css.gz | true  | text/css | gzipContent           | gzip-etag-should-not-be-used |
  And the following request:
    | property    | value                                                                          |
    | contextPath | /webapp/com.example.myproject/_/service/com.example.myproject/static           |
    | rawPath     | /webapp/com.example.myproject/_/service/com.example.myproject/static/index.css |
  And the request header "accept-encoding" is "br;q=0, deflate;q=0.6, identity;q=0.4, *;q=0.1, gzip;q=0 "
  When requestHandler is called
  Then the response should have the following properties:
    | property    | value                 |
    | body        | body { color: green } |
    | status      | 200                   |
    | contentType | text/css              |
  And the response should have the following headers:
    | header           | value                               |
    | cache-control    | public, max-age=31536000, immutable |
    | content-encoding | undefined                           |
    | etag             | "etag-index-css"                    |
    | vary             | Accept-Encoding                     |

Scenario: Does not use compression when trimmed accept-encoding endswith br;q=0 and includes gzip;q=0,
  Given enonic xp is running in production mode
  Given the following resources:
    | path                 | exist | mimeType | content               | etag                         |
    | /static/index.css    | true  | text/css | body { color: green } | etag-index-css               |
    | /static/index.css.br | true  | text/css | brContent             | br-etag-should-not-be-used   |
    | /static/index.css.gz | true  | text/css | gzipContent           | gzip-etag-should-not-be-used |
  And the following request:
    | property    | value                                                                          |
    | contextPath | /webapp/com.example.myproject/_/service/com.example.myproject/static           |
    | rawPath     | /webapp/com.example.myproject/_/service/com.example.myproject/static/index.css |
  And the request header "accept-encoding" is "gzip;q=0, deflate;q=0.6, identity;q=0.4, *;q=0.1, br;q=0 "
  When requestHandler is called
  Then the response should have the following properties:
    | property    | value                 |
    | body        | body { color: green } |
    | status      | 200                   |
    | contentType | text/css              |
  And the response should have the following headers:
    | header           | value                               |
    | cache-control    | public, max-age=31536000, immutable |
    | content-encoding | undefined                           |
    | etag             | "etag-index-css"                    |
    | vary             | Accept-Encoding                     |

Scenario: handles camelcase request headers
  Given enonic xp is running in production mode
  Given the following resources:
    | path                 | exist | mimeType | content               | etag                         |
    | /static/index.css    | true  | text/css | body { color: green } | etag-index-css               |
    | /static/index.css.br | true  | text/css | brContent             | br-etag-should-not-be-used   |
    | /static/index.css.gz | true  | text/css | gzipContent           | gzip-etag-should-not-be-used |
  And the following request:
    | property    | value                                                                          |
    | contextPath | /webapp/com.example.myproject/_/service/com.example.myproject/static           |
    | rawPath     | /webapp/com.example.myproject/_/service/com.example.myproject/static/index.css |
  And the following request headers:
    | header           | value                   |
    | Accept-Encoding  | gzip, deflate, br, zstd |
  When requestHandler is called
  Then the response should have the following properties:
    | property    | value      |
    | body        | brContent  |
    | status      | 200        |
    | contentType | text/css   |
  And the response should have the following headers:
    | header           | value                               |
    | cache-control    | public, max-age=31536000, immutable |
    | content-encoding | br                                  |
    | etag             | "etag-index-css-br"                 |
    | vary             | Accept-Encoding                     |

Scenario: handles camelcase accept-encoding header
  Given enonic xp is running in production mode
  Given the following resources:
    | path                 | exist | mimeType | content               | etag                         |
    | /static/index.css    | true  | text/css | body { color: green } | etag-index-css               |
    | /static/index.css.br | true  | text/css | brContent             | br-etag-should-not-be-used   |
    | /static/index.css.gz | true  | text/css | gzipContent           | gzip-etag-should-not-be-used |
  And the following request:
    | property    | value                                                                          |
    | contextPath | /webapp/com.example.myproject/_/service/com.example.myproject/static           |
    | rawPath     | /webapp/com.example.myproject/_/service/com.example.myproject/static/index.css |
  And the request header "accept-encoding" is "GzIp, DeFlAtE, bR, zStD"
  When requestHandler is called
  Then the response should have the following properties:
    | property    | value      |
    | body        | brContent  |
    | status      | 200        |
    | contentType | text/css   |
  And the response should have the following headers:
    | header           | value                               |
    | cache-control    | public, max-age=31536000, immutable |
    | content-encoding | br                                  |
    | etag             | "etag-index-css-br"                 |
    | vary             | Accept-Encoding                     |

Scenario: [PROD] Responds with 404 bad request with just status when request.rawPath is missing
  Given enonic xp is running in production mode
  Given the following request:
    | property    | value |
  When requestHandler is called
  # Then the response is info logged
  Then the response should have the following properties:
    | property | value |
    | status   | 400   |

Scenario: [DEV] Responds with 404 bad request with body and contentType when request.rawPath is missing
  Given enonic xp is running in development mode
  Given the following request:
    | property    | value |
  When requestHandler is called
  # Then the response is info logged
  Then the response should have the following properties:
    | property    | value                                                                                            |
    | status      | 400                                                                                              |
    | contentType | text/plain; charset=utf-8                                                                        |
    | body        | Invalid request without rawPath: {}! request.rawPath is needed when index is set to "index.html" |

Scenario: [PROD] Responds with 400 Bad request when index is enabled, rawPath has no trailing slash and request.path is missing
  Given enonic xp is running in production mode
  Given the following resources:
    | path                      | exist |  type      | content       | etag            |
    | /static/folder/index.html | true  |  text/html | <html></html> | etag-index-html |
    | /static/folder            | false |            |               |                 |
  And the following request:
    | property    | value                                                                       |
    | contextPath | /webapp/com.example.myproject/_/service/com.example.myproject/static        |
    | rawPath     | /webapp/com.example.myproject/_/service/com.example.myproject/static/folder |
  # When the resources are info logged
  When requestHandler is called
  # And the response is info logged
  Then the response should have the following properties:
    | property    | value         |
    | status      | 400           |

Scenario: [DEV] Responds with 400 Bad request when index is enabled, rawPath has no trailing slash and request.path is missing
  Given enonic xp is running in development mode
  Given the following resources:
    | path                      | exist | type      | content       | etag            |
    | /static/folder/index.html | true  | text/html | <html></html> | etag-index-html |
    | /static/folder            | false |           |               |                 |
  And the following request:
    | property    | value                                                                       |
    | contextPath | /webapp/com.example.myproject/_/service/com.example.myproject/static        |
    | rawPath     | /webapp/com.example.myproject/_/service/com.example.myproject/static/folder |
  # When the resources are info logged
  When requestHandler is called
  # And the response is info logged
  Then the response should have the following properties:
    | property    | value         |
    | status      | 400           |
    | contentType | text/plain; charset=utf-8 |
  And the response body should start with "Invalid request without path: "


Scenario: Responds with 301 Moved Permanently when index is enabled, rawPath has no trailing slash, but index is found
  Given enonic xp is running in production mode
  Given the following resources:
    | path                      | exist | type      | content       | etag            |
    | /static/folder/index.html | true  | text/html | <html></html> | etag-index-html |
    | /static/folder            | false |           |               |                 |
  And the following request:
    | property    | value                                                                       |
    | contextPath | /webapp/com.example.myproject/_/service/com.example.myproject/static        |
    | rawPath     | /webapp/com.example.myproject/_/service/com.example.myproject/static/folder |
    | path        | /webapp/com.example.myproject/_/service/com.example.myproject/static/folder |
  # When the resources are info logged
  When requestHandler is called
  # And the response is info logged
  Then the response should have the following properties:
    | property    | value         |
    | status      | 301           |
  Then the response should have the following headers:
    | header        | value                              |
    | location      | /webapp/com.example.myproject/_/service/com.example.myproject/static/folder/ |

Scenario: [PROD] Responds with 400 bad request with just status when path is illegal
  Given enonic xp is running in production mode
  Given the following resources:
    |path|
  And the following request:
    | property    | value                                                                  |
    | contextPath | /webapp/com.example.myproject/_/service/com.example.myproject/static   |
    | rawPath     | /webapp/com.example.myproject/_/service/com.example.myproject/static/< |
  When requestHandler is called
  # And the response is info logged
  Then the response should have the following properties:
    | property    | value         |
    | status      | 400           |

Scenario: [DEV] Responds with 400 bad request with body and contentType when path is illegal
  Given enonic xp is running in development mode
  Given the following resources:
    |path|
  And the following request:
    | property    | value                                                                  |
    | contextPath | /webapp/com.example.myproject/_/service/com.example.myproject/static   |
    | rawPath     | /webapp/com.example.myproject/_/service/com.example.myproject/static/< |
  When requestHandler is called
  # And the response is info logged
  Then the response should have the following properties:
    | property    | value                     |
    | status      | 400                       |
    | contentType | text/plain; charset=utf-8 |
  And the response body should start with "can't contain '..' or any of these characters:"

Scenario: Responds with 404 when resource doesn't exist
  Given enonic xp is running in production mode
  Given the following resources:
    | path                         | exist |
    | /static/index.css            | false |
    | /static/index.css/index.html | false |
  And the following request:
    | property    | value                                                                                               |
    | contextPath | /webapp/com.example.myproject/_/service/com.example.myproject/static                                |
    | rawPath     | /webapp/com.example.myproject/_/service/com.example.myproject/static/index.css                      |
    | url         | http://localhost:8080/webapp/com.example.myproject/_/service/com.example.myproject/static/index.css |
  # When the resources are info logged
  # When the request is info logged
  When requestHandler is called
  # Then the response is info logged
  Then the response should have the following properties:
    | property    | value |
    | status      | 404   |

Scenario: Responds with private, no-store and no etag when resource found in development mode
  Given enonic xp is running in development mode
  Given the following resources:
    | path                        | exist | type     | etag           | content               |
    | /static/index.css           | true  | text/css | etag-index-css | body { color: green } |
  And the following request:
    | property    | value                                                                                               |
    | contextPath | /webapp/com.example.myproject/_/service/com.example.myproject/static                                |
    | rawPath     | /webapp/com.example.myproject/_/service/com.example.myproject/static/index.css                      |
    | url         | http://localhost:8080/webapp/com.example.myproject/_/service/com.example.myproject/static/index.css |
  # When the resources are info logged
  # When the request is info logged
  When requestHandler is called
  # Then the response is info logged
  Then the response should have the following properties:
    | property    | value                 |
    | body        | body { color: green } |
    | status      | 200                   |
    | contentType | text/css              |
  And the response should have the following headers:
    | header        | value             |
    | etag          | undefined         |
    | cache-control | private, no-store |

Scenario: Responds with 304 Not modified when if-none-match matches etag
  Given enonic xp is running in production mode
  Given the following resources:
    | path                        | exist | type     | etag           | content               |
    | /static/index.css           | true  | text/css | etag-index-css | body { color: green } |
  And the following request:
    | property    | value                                                                                               |
    | contextPath | /webapp/com.example.myproject/_/service/com.example.myproject/static                                |
    | rawPath     | /webapp/com.example.myproject/_/service/com.example.myproject/static/index.css                      |
    | url         | http://localhost:8080/webapp/com.example.myproject/_/service/com.example.myproject/static/index.css |
  And the following request headers:
    | header        | value           |
    | if-none-match | "etag-index-css" |
  # When the resources are info logged
  # When the request is info logged
  When requestHandler is called
  # Then the response is info logged
  Then the response should have the following properties:
    | property    | value                 |
    | status      | 304                   |

Scenario: Responds with safe cache-control when resource is /favicon.ico
  Given enonic xp is running in production mode
  Given the following resources:
    | path                | exist | type         | etag             | content        |
    | /static/favicon.ico | true  | image/x-icon | etag-favicon-ico | faviconContent |
  And the following request:
    | property    | value                                                                                                 |
    | contextPath | /webapp/com.example.myproject/_/service/com.example.myproject/static                                  |
    | rawPath     | /webapp/com.example.myproject/_/service/com.example.myproject/static/favicon.ico                      |
    | path        | /webapp/com.example.myproject/_/service/com.example.myproject/static/favicon.ico                      |
    | url         | http://localhost:8080/webapp/com.example.myproject/_/service/com.example.myproject/static/favicon.ico |
  # When the resources are info logged
  # When the request is info logged
  When requestHandler is called
  # Then the response is info logged
  Then the response should have the following properties:
    | property    | value                 |
    | status      | 200                   |
    | contentType | image/x-icon          |
    | body        | faviconContent        |
  And the response should have the following headers:
    | header        | value                                                        |
    | cache-control | public, max-age=10, s-maxage=3600, stale-while-revalidate=50 |
    | etag          | "etag-favicon-ico"                                           |

Scenario: Responds with crawler cache-control when resource is /sitemap.xml
  Given enonic xp is running in production mode
  Given the following resources:
    | path                | exist | type            | etag             | content           |
    | /static/sitemap.xml | true  | application/xml | etag-sitemap-xml | sitemapXmlContent |
  And the following request:
    | property    | value                                                                                                 |
    | contextPath | /webapp/com.example.myproject/_/service/com.example.myproject/static                                  |
    | rawPath     | /webapp/com.example.myproject/_/service/com.example.myproject/static/sitemap.xml                      |
    | path        | /webapp/com.example.myproject/_/service/com.example.myproject/static/sitemap.xml                      |
    | url         | http://localhost:8080/webapp/com.example.myproject/_/service/com.example.myproject/static/sitemap.xml |
  # When the resources are info logged
  # When the request is info logged
  When requestHandler is called
  # Then the response is info logged
  Then the response should have the following properties:
    | property    | value                 |
    | status      | 200                   |
    | contentType | application/xml       |
    | body        | sitemapXmlContent     |
  And the response should have the following headers:
    | header        | value                                           |
    | cache-control | public, max-age=3600, stale-while-revalidate=60 |
    | etag          | "etag-sitemap-xml"                              |

Scenario: Responds with prevent cache-control when resource is /BingSiteAuth.xml
  Given enonic xp is running in production mode
  Given the following resources:
    | path                     | exist | type            | etag                  | content        |
    | /static/BingSiteAuth.xml | true  | application/xml | etag-bingsiteauth-xml | BingSiteAuthXmlContent |
  And the following request:
    | property    | value                                                                                                      |
    | contextPath | /webapp/com.example.myproject/_/service/com.example.myproject/static                                       |
    | rawPath     | /webapp/com.example.myproject/_/service/com.example.myproject/static/BingSiteAuth.xml                      |
    | path        | /webapp/com.example.myproject/_/service/com.example.myproject/static/BingSiteAuth.xml                      |
    | url         | http://localhost:8080/webapp/com.example.myproject/_/service/com.example.myproject/static/BingSiteAuth.xml |
  # When the resources are info logged
  # When the request is info logged
  When requestHandler is called
  # Then the response is info logged
  Then the response should have the following properties:
    | property    | value                  |
    | status      | 200                    |
    | contentType | application/xml        |
    | body        | BingSiteAuthXmlContent |
  And the response should have the following headers:
    | header        | value                              |
    | cache-control | public, max-age=0, must-revalidate |
    | etag          | "etag-bingsiteauth-xml"            |

Scenario: Responds with safe cache-control when resource path starts with /.well-known/
  Given enonic xp is running in production mode
  Given the following resources:
    | path                         | exist | type       | etag          | content         |
    | /static/.well-known/whatever | true  | text/plain | etag-whatever | whateverContent |
  And the following request:
    | property    | value                                                                                                          |
    | contextPath | /webapp/com.example.myproject/_/service/com.example.myproject/static                                           |
    | rawPath     | /webapp/com.example.myproject/_/service/com.example.myproject/static/.well-known/whatever                      |
    | path        | /webapp/com.example.myproject/_/service/com.example.myproject/static/.well-known/whatever                      |
    | url         | http://localhost:8080/webapp/com.example.myproject/_/service/com.example.myproject/static/.well-known/whatever |
  # When the resources are info logged
  # When the request is info logged
  When requestHandler is called
  # Then the response is info logged
  Then the response should have the following properties:
    | property    | value           |
    | status      | 200             |
    | contentType | text/plain      |
    | body        | whateverContent |
  And the response should have the following headers:
    | header        | value                                                        |
    | cache-control | public, max-age=10, s-maxage=3600, stale-while-revalidate=50 |
    | etag          | "etag-whatever"                                              |

Scenario: Responds with 500 internal server error when root parameter is empty
  Given enonic xp is running in production mode
  When requestHandler is called with the following parameters:
    | param | value |
    | root  |       |
  # Then the response is info logged
  Then the response should have the following properties:
    | property    | value                     |
    | status      | 500                       |
    | contentType | text/plain; charset=utf-8 |
  And the response body should start with "Server error (logged with error ID:"
