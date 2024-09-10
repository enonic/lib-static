import {mockJava} from './mockJava';
import {
  STATIC_ASSETS_INDEX_HTML,
  STATIC_ASSETS_200_CSS,
  STATIC_ASSETS_304_CSS
} from './testdata'


const resources = {
  '/com.enonic.lib.static.json': {
    exists: false,
  },
  '/static/assets/index.html': {
      bytes: STATIC_ASSETS_INDEX_HTML,
      etag: '1234567890abcdef',
      exists: true,
      mimeType: 'text/html',
    },
    '/static/filenameWithoutExt': {
      bytes: 'Hello, world!',
      etag: '1234567890abcdef',
      exists: true,
      mimeType: 'text/plain',
    },
    '/static/assets/200.css': {
      bytes: STATIC_ASSETS_200_CSS,
      etag: '1234567890abcdef',
      exists: true,
      mimeType: 'text/css',
    },
    '/static/assets/200.css/index.html': {
      bytes: STATIC_ASSETS_INDEX_HTML,
      etag: 'static_assets_200_css_index_html',
      exists: true,
      mimeType: 'text/css',
    },
    '/custom/root/assets/200.css': {
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
      bytes: STATIC_ASSETS_INDEX_HTML,
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
    '/static/assets/404.css': {
      exists: false,
      mimeType: 'text/css',
    },
    '/static/assets/404.css/index.html': {
      exists: false,
      mimeType: 'text/html',
    },
    '/static/assets/trailingSlash.css/': {
      exists: false,
      mimeType: 'text/css',
    },
    '/static/assets/trailingSlash.css/index.html': {
      bytes: STATIC_ASSETS_INDEX_HTML,
      exists: true,
      etag: '1234567890abcdef',
      mimeType: 'text/html',
    }
};

// NOTE: /lib/xp/io expects path to start with a slash
[
  '/',
  '/static',
  '/static/',
  '/static/assets',
  '/static/assets/',
].forEach(path => {
  resources[path] = {
    bytes: undefined,
    etag: undefined,
    exists: false,
    isDirectory: true,
    mimeType: undefined,
    // timestamp: -1,
    // size: -1,
  };
});

mockJava({
  // Testing production mode is the most importent, override per test if needed
  devMode: false,
  // NOTE: Prod mode has etags, dev mode does not
  resources
});
