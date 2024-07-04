import {
  getSize,
  type ByteSource,
  type Resource as ResourceInterface,
  type ResourceKey
} from '@enonic-types/lib-io';
import type {App, DoubleUnderscore, Log} from './global.d';


import {isObject} from './isObject';


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
    debug: () => {},
    // debug: console.debug,
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

export const STATIC_ASSETS_304_CSS = `body { color: red; }`;

globalThis.__ = {
  // disposer
  // @ts-ignore
  newBean: (bean: string) => {
    if (bean === 'lib.enonic.libStatic.etag.EtagService') {
      return {
        getEtag: (path: string, etagOverride?: number) => {
          if (path === 'com.example.myproject:/myrootindex.html') {
            return {
              etag: '1234567890abcdef'
            };
          }
          if (path === 'com.example.myproject:/static/assets/304.css') {
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
          if (name === '/myrootindex.html') {
            return 'text/html';
          }
          if (name === '/static/assets/304.css') {
            // TODO why is this called even though if-none-match matched etag???
            return 'text/css';
          }
          throw new Error(`getMimeType: Unmocked name:${name}!`);
        },
        getResource: (key: string|ResourceKey) => {

          if (key === '/myrootindex.html') {
            return {
              getBytes: () => {
                if (key === '/myrootindex.html') {
                  return INDEX_HTML;
                }
                throw new Error(`getBytes: Unmocked key:${JSON.stringify(key, null, 4)}!`);
              },
              getSize: () => 1,
              getTimestamp: () => 2,
              getStream: () => {
                throw new Error(`getStream called key:${JSON.stringify(key, null, 4)}`);
              },
              exists: () => true,
            }; // ResourceInterface
          }

          if (key === '/static/assets/400.css' || key === '/static/assets/400.css/index.html') {
            return {
              exists: () => false,
            };
          }

          if (key === '/static/assets/303.css') {
            return {
              exists: () => false,
            };
          }
          if (key === '/static/assets/303.css/index.html') { // Fallback
            return {
              getBytes: () => INDEX_HTML,
              getSize: () => 1,
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
              getSize: () => 1,
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
