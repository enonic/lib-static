import {mockJava} from './mockJava';

export const INDEX_HTML = `
<html>
  <body>
    <h1>Hello, World!</h1>
  </body>
</html>`;

export const STATIC_ASSETS_200_CSS = `body { color: green; }`;
export const STATIC_ASSETS_304_CSS = `body { color: yellow; }`;

mockJava({
  // Testing production mode is the most importent, override per test if needed
  devMode: false,
  // NOTE: Prod mode has etags, dev mode does not
  resources: {
    '/static/assets/200.css': {
      bytes: STATIC_ASSETS_200_CSS,
      etag: '1234567890abcdef',
      exists: true,
      mimeType: 'text/css',
    },
    '/static/assets/303.css': {
      exists: false,
      mimeType: 'text/css',
    },
    '/static/assets/303.css/index.html': {
      bytes: INDEX_HTML,
      etag: '1234567890abcdef',
      exists: true,
      mimeType: 'text/html',
    },
    '/static/assets/304.css': {
      bytes: STATIC_ASSETS_304_CSS,
      etag: '1234567890abcdef',
      exists: true,
      mimeType: 'text/css',
    },
    '/static/assets/400.css': {
      exists: false,
      mimeType: 'text/css',
    },
    '/static/assets/400.css/index.html': {
      exists: false,
      mimeType: 'text/html',
    },
    '/static/assets/trailingSlash.css/': {
      exists: false,
      mimeType: 'text/css',
    },
    '/static/assets/trailingSlash.css/index.html': {
      bytes: INDEX_HTML,
      exists: true,
      etag: '1234567890abcdef',
      mimeType: 'text/html',
    }
  }
});
