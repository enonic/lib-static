import type {
  ByteSource,
  getResource as getResourceValue,
  ResourceKey
} from '@enonic-types/lib-io';
import type { App, DoubleUnderscore, Log } from './global.d';

import { jest } from '@jest/globals';
import { isObject } from './isObject';
// import { mockLibXpVhost } from './mockLibXpVhost';
import { Resource } from './Resource';
import {
  STATIC_ASSETS_200_CSS,
  STATIC_ASSETS_INDEX_HTML
} from './testdata';


// Avoid type errors
declare module globalThis {
  var app: App
  var log: Log
  var __: DoubleUnderscore
}

export function mockJava({
  devMode = false,
  resources = {}
}: {
  devMode?: boolean
  resources?: Record<string, {
    bytes?: string
    exists?: boolean
    etag?: string
    mimeType: string
  }>
}) {
  // In order for console to exist in the global scope when running tests in
  // testEnvironment: 'node' the @types/node package must be installed and
  // potentially listed under types in tsconfig.json.
  globalThis.log = {
    // debug: () => {},
    // error: () => {},
    // info: () => {},
    // warning: () => {},
    error: console.error,
    debug: console.debug,
    info: console.info,
    warning: console.warn,
  }
  globalThis.__ = {
    // disposer,
    // @ts-ignore
    newBean: (bean: string) => {
      if (bean === 'lib.enonic.libStatic.AppHelper') {
        return {
          isDevMode: () => devMode
        };
      } // AppHelper
      if (bean === 'lib.enonic.libStatic.etag.EtagService') {
        return {
          getEtag: (path: string, etagOverride?: number) => {
            if (etagOverride === -1) {
              return {
                etag: undefined
              };
            }
            const name = path.replace(/^com\.example\.myproject:/, '');
            // console.debug('getEtag', {name, path, etagOverride});
            const resource = resources[name];
            if (resource) {
              return {
                etag: resource.etag ? `"${resource.etag}"` : undefined
              };
            }
            throw new Error(`getEtag: Unmocked path:${path} etagOverride:${etagOverride}!`);
          }
        }
      } // EtagService
      if (bean === 'lib.enonic.libStatic.IoService') {
        return {
          getMimeType: (name: string|ResourceKey) => {
            const mimeType = resources[name as string]?.mimeType;
            if (mimeType) {
              return mimeType;
            }
            log.debug(`getMimeType: Unmocked name:${name}!`);
            return 'application/octet-stream';
          },
          getResource: (key: string|ResourceKey) => {
            const resource = resources[key as string];
            if (!resource) {
              throw new Error(`getResource: Unmocked key:${JSON.stringify(key, null, 4)}!`);
            }

            if (!resource.exists) {
              return {
                exists: () => false,
              };
            }

            return new Resource({
              bytes: resource.bytes,
              exists: true,
              key: key.toString(),
              size: resource.bytes.length,
              timestamp: 2
            });
          }, // getResource
          readText: (_stream: ByteSource) => {
            // console.debug('readText');
            return 'readTextResult';
          },
        }
      } // IoService
      throw new Error(`Unmocked bean:${bean}!`);
    }, // newBean
    nullOrValue: (v: any) => {
      console.debug(`nullOrValue value:${JSON.stringify(v, null, 4)}`);
      return v;
    },
    toNativeObject: (v: any) => {
      // console.debug(`toNativeObject value:${JSON.stringify(v, null, 4)}`);
      if (
        isObject(v)
        // && v['etag'] === '"1234567890abcdef"'
      ) {
        return v as any;
      }
      throw new Error(`toNativeObject: Unmocked value:${JSON.stringify(v, null, 4)}!`);
    },
    toScriptValue: (v: any) => {
      console.debug(`toScriptValue value:${JSON.stringify(v, null, 4)}`);
      return v;
    },
  }

  jest.mock('/lib/xp/io', () => ({
    getResource: jest.fn<typeof getResourceValue>((key) => {
      if (key === '/static/assets/index.html') {
        return new Resource({
          bytes: STATIC_ASSETS_INDEX_HTML,
          exists: true,
          key: key.toString(),
          size: STATIC_ASSETS_INDEX_HTML.length,
          timestamp: Date.now()
        });
      }
      if (key === '/static/assets/200.css' || key === '/custom/root/assets/200.css') {
        return new Resource({
          bytes: STATIC_ASSETS_200_CSS,
          exists: true,
          key: key.toString(),
          size: STATIC_ASSETS_200_CSS.length,
          timestamp: Date.now()
        });
      }
      if (key === '/static/assets/500.css') {
        throw new Error('Manually thrown error :)');
      }
      return {
        exists: () => false,
      } as Resource;
    })
  }), { virtual: true });

  jest.mock('/lib/xp/portal', () => ({
  }), { virtual: true });
  // mockLibXpVhost();
} // mockJava
