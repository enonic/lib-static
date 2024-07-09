import {
  getSize,
  type ByteSource,
  type Resource as ResourceInterface,
  type ResourceKey
} from '@enonic-types/lib-io';
import type {App, DoubleUnderscore, Log} from './global.d';


import {isObject} from './isObject';
import {Resource} from './Resource';


// Avoid type errors
declare module globalThis {
    var app: App
    var log: Log
    var __: DoubleUnderscore
}


// In order for console to exist in the global scope when running tests in
// testEnvironment: 'node' the @types/node package must be installed and
// potentially listed under types in tsconfig.json.
globalThis.log = {
    // debug: () => {},
    debug: console.debug,
    info: console.info,
    error: console.error,
    warning: console.warn
}

// declare global {
//   interface XpBeans {
//     'lib.enonic.libStatic.etag.EtagService': {
//       getEtag: (path: string, etagOverride?: number) => Record<string,string>
//     }
//   }
// }

// type NewBean = DoubleUnderscore['newBean']
// type NewBean = <T = unknown, Bean extends keyof XpBeans | string = string>(bean: Bean) =>
//   Bean extends keyof XpBeans ? XpBeans[Bean] : T;

// const newBean = (bean: string) => {
//   if (bean === 'lib.enonic.libStatic.etag.EtagService') {
//     return {
//       getEtag: (path: string, etagOverride?: number) => {
//         console.debug(`getEtag path:${path} etagOverride:${etagOverride}`);
//         return {};
//       }
//     }
//   }
// }

export const INDEX_HTML = `
<html>
  <body>
    <h1>Hello, World!</h1>
  </body>
</html>`;

export const STATIC_ASSETS_200_CSS = `body { color: green; }`;
export const STATIC_ASSETS_304_CSS = `body { color: yellow; }`;

globalThis.__ = {
  // disposer
  // @ts-ignore
  newBean: (bean: string) => {
    if (bean === 'lib.enonic.libStatic.etag.EtagService') {
      return {
        getEtag: (path: string, etagOverride?: number) => {
          if (
            path === 'com.example.myproject:/static/assets/200.css'
            || path === 'com.example.myproject:/static/assets/304.css'
            || path === 'com.example.myproject:/static/assets/trailingSlash.css/index.html'
          ) {
            return {
              etag: '1234567890abcdef'
            };
          }
          throw new Error(`getEtag: Unmocked path:${path} etagOverride:${etagOverride}!`);
        }
      }
    }
    if (bean === 'lib.enonic.libStatic.IoService') {
      return {
        getMimeType: (name: string|ResourceKey) => {
          if (name === '/static/assets/200.css' || name === '/static/assets/304.css') {
            // TODO why is this called even though if-none-match matched etag???
            return 'text/css';
          }
          if (name === '/static/assets/trailingSlash.css/index.html') {
            return 'text/html';
          }
          throw new Error(`getMimeType: Unmocked name:${name}!`);
        },
        getResource: (key: string|ResourceKey) => {

          if (key === '/static/assets/400.css' || key === '/static/assets/400.css/index.html') {
            return {
              exists: () => false,
            };
          }

          if (
            key === '/static/assets/303.css'
            || key === '/static/assets/trailingSlash.css/'
          ) {
            return {
              exists: () => false,
            };
          }
          if (
            key === '/static/assets/303.css/index.html'
            || key === '/static/assets/trailingSlash.css/index.html'
          ) { // Fallback
            return new Resource({
              bytes: INDEX_HTML,
              exists: true,
              key,
              size: INDEX_HTML.length,
              timestamp: 2
            });
          }

          if (key === '/static/assets/200.css') {
            return {
              // TODO why are these called even though if-none-match matched etag???
              getBytes: () => STATIC_ASSETS_200_CSS,
              getSize: () => STATIC_ASSETS_200_CSS.length,
              getTimestamp: () => 2,
              getStream: () => {
                throw new Error(`getStream called key:${JSON.stringify(key, null, 4)}`);
              },
              exists: () => true,
            };
          }

          if (key === '/static/assets/304.css') {
            return {
              // TODO why are these called even though if-none-match matched etag???
              getBytes: () => STATIC_ASSETS_304_CSS,
              getSize: () => STATIC_ASSETS_304_CSS.length,
              getTimestamp: () => 2,
              getStream: () => {
                throw new Error(`getStream called key:${JSON.stringify(key, null, 4)}`);
              },
              exists: () => true,
            };
          }

          throw new Error(`getResource: Unmocked key:${JSON.stringify(key, null, 4)}!`);
        },
        readText: (_stream: ByteSource) => {
          console.debug('readText');
          return 'readTextResult';
        },
      }
    }
    if (bean === 'lib.enonic.libStatic.AppHelper') {
      return {
        isDevMode: () => true // NOTE we might want to override this per test
      };
    }
    throw new Error(`Unmocked bean:${bean}!`);
  },
  nullOrValue: (v: any) => {
    console.debug(`nullOrValue value:${JSON.stringify(v, null, 4)}`);
    return v;
  },
  // registerMock
  toNativeObject: (v: any) => {
    if (isObject(v) && v['etag'] === '1234567890abcdef') {
      return v as any;
    }
    throw new Error(`toNativeObject: Unmocked value:${JSON.stringify(v, null, 4)}!`);
    // console.debug(`toNativeObject value:${JSON.stringify(v, null, 4)}`);
  },
  toScriptValue: (v: any) => {
    console.debug(`toScriptValue value:${JSON.stringify(v, null, 4)}`);
    return v;
  },
};
