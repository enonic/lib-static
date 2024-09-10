Feature: requestHandler

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

Scenario: Responds with 200 ok when index is enabled, rawPath has trailing slash and resource isDirectory
  Given enonic xp is running in production mode
  Given the following resources:
    | path                      | exist | isDir | type      | content       | etag            |
    | /static/folder/index.html | true  | false | text/html | <html></html> | etag-index-html |
    | /static/folder            | true  | true  |           |               |                 |
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

Scenario: [PROD] Responds with 400 Bad request when request.path is missing and index is enabled, rawPath has no trailing slash and resource isDirectory
  Given enonic xp is running in production mode
  Given the following resources:
    | path                      | exist | isDir | type      | content       | etag            |
    | /static/folder/index.html | true  | false | text/html | <html></html> | etag-index-html |
    | /static/folder            | true  | true  |           |               |                 |
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

Scenario: [DEV] Responds with 400 Bad request when request.path is missing and index is enabled, rawPath has no trailing slash and resource isDirectory
  Given enonic xp is running in development mode
  Given the following resources:
    | path                      | exist | isDir | type      | content       | etag            |
    | /static/folder/index.html | true  | false | text/html | <html></html> | etag-index-html |
    | /static/folder            | true  | true  |           |               |                 |
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


Scenario: Responds with 301 Moved Permanently when index is enabled, rawPath has no trailing slash and resource isDirectory
  Given enonic xp is running in production mode
  Given the following resources:
    | path                      | exist | isDir | type      | content       | etag            |
    | /static/folder/index.html | true  | false | text/html | <html></html> | etag-index-html |
    | /static/folder            | true  | true  |           |               |                 |
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
    | path              | exist |
    | /static/index.css | false |
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

Scenario: Responds with no-store and no etag when resource found in development mode
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
    | header        | value     |
    | etag          | undefined |
    | cache-control | no-store  |

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
    | header        | value                                         |
    | cache-control | public, max-age=10, stale-while-revalidate=50 |
    | etag          | "etag-favicon-ico"                            |

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
    | header        | value               |
    | cache-control | public, max-age=600 |
    | etag          | "etag-sitemap-xml"  |

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

Scenario: Responds with safe cache-control when resource path ends with .webmanifest
  Given enonic xp is running in production mode
  Given the following resources:
    | path                     | exist | type            | etag                  | content        |
    | /static/whatever.webmanifest | true  | application/xml | etag-whatever-webmanifest | whateverWebmanifestContent |
  And the following request:
    | property    | value                                                                                                          |
    | contextPath | /webapp/com.example.myproject/_/service/com.example.myproject/static                                           |
    | rawPath     | /webapp/com.example.myproject/_/service/com.example.myproject/static/whatever.webmanifest                      |
    | path        | /webapp/com.example.myproject/_/service/com.example.myproject/static/whatever.webmanifest                      |
    | url         | http://localhost:8080/webapp/com.example.myproject/_/service/com.example.myproject/static/whatever.webmanifest |
  # When the resources are info logged
  # When the request is info logged
  When requestHandler is called
  # Then the response is info logged
  Then the response should have the following properties:
    | property    | value                  |
    | status      | 200                    |
    | contentType | application/xml        |
    | body        | whateverWebmanifestContent |
  And the response should have the following headers:
    | header        | value                                         |
    | cache-control | public, max-age=10, stale-while-revalidate=50 |
    | etag          | "etag-whatever-webmanifest"                   |
