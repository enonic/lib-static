import type {App, DoubleUnderscore, Log} from './global.d';

import {jest} from '@jest/globals';
import {isObject} from './isObject';
// import {mockLibXpVhost} from './mockLibXpVhost';
// import {Resource} from './Resource';
import {mockEtagService} from './mocks/etagService';
import {mockIoService} from './mocks/ioService';
import {glob} from 'fs';
// import {
//   STATIC_ASSETS_200_CSS,
//   STATIC_ASSETS_INDEX_HTML
// } from './testdata';


// Avoid type errors
declare module globalThis {
  var app: App
  var log: Log
  var __: DoubleUnderscore
  var _devMode: boolean;
  var _resources: Record<string, {
    bytes?: string
    exists?: boolean
    etag?: string
    mimeType?: string
  }>
}

export function mockJava({
  devMode = false,
  resources,
}: {
  devMode?: boolean
  resources: Record<string, {
    bytes?: string
    exists?: boolean
    etag?: string
    mimeType?: string
  }>
}) {
  globalThis._devMode = devMode;
  globalThis._resources = resources;
  // In order for console to exist in the global scope when running tests in
  // testEnvironment: 'node' the @types/node package must be installed and
  // potentially listed under types in tsconfig.json.
  globalThis.log = {
    debug: () => {},
    error: () => {},
    info: () => {},
    warning: () => {},
    // error: console.error,
    // debug: console.debug,
    // info: console.info,
    // warning: console.warn,
  }
  globalThis.__ = {
    // disposer,
    // @ts-ignore
    newBean: (bean: string) => {
      if (bean === 'lib.enonic.libStatic.AppHelper') {
        return {
          isDevMode: () => globalThis._devMode,
        };
      } // AppHelper
      if (bean === 'lib.enonic.libStatic.etag.EtagService') {
        return mockEtagService();
      }
      if (bean === 'lib.enonic.libStatic.IoService') {
        return mockIoService();
      }
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

  jest.mock('/lib/xp/portal', () => ({
  }), {virtual: true});
  // mockLibXpVhost();
} // mockJava
