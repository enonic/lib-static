import {
  getSize,
  type ByteSource,
  type Resource as ResourceInterface,
  type ResourceKey
} from '@enonic-types/lib-io';
import type {App, DoubleUnderscore, Log} from './global.d';


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

globalThis.__ = {
  // disposer
  // @ts-ignore
  newBean: (bean: string) => {
    if (bean === 'lib.enonic.libStatic.etag.EtagService') {
      return {
        getEtag: (path: string, etagOverride?: number) => {
          if (path === 'com.example.myproject:/myrootindex.html') {
            return '1234567890abcdef';
            }
            throw new Error(`getEtag: Unmocked path:${path} etagOverride:${etagOverride}!`);
            // console.debug(`getEtag path:${path} etagOverride:${etagOverride}`);
        }
      }
    }
    if (bean === 'lib.enonic.libStatic.IoService') {
      return {
        getMimeType: (name: string|ResourceKey) => {
          if (name === '/myrootindex.html') {
            return 'text/html';
            }
            throw new Error(`getMimeType: Unmocked name:${name}!`);
            // console.debug(`getMimeType name:${JSON.stringify(name, null, 4)}`);
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
            // console.debug(`getResource key:${JSON.stringify(key, null, 4)}`);
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
    if (v === '1234567890abcdef') {
      return v;
    }
    throw new Error(`toNativeObject: Unmocked value:${JSON.stringify(v, null, 4)}!`);
    // console.debug(`toNativeObject value:${JSON.stringify(v, null, 4)}`);
  },
  toScriptValue: (v: any) => {
    console.debug(`toScriptValue value:${JSON.stringify(v, null, 4)}`);
    return v;
  },
};
