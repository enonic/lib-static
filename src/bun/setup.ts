import type { AssetUrlParams } from '@enonic-types/lib-portal';
import type { App, DoubleUnderscore, Log } from '../jest/global.d';

import {
  // expect,
  // jest,
  mock,
  // test as it
} from 'bun:test';
// @ts-ignore
import colors from 'colors/safe';
// @ts-ignore
import {stringify} from 'q-i';
import { isObject } from '../jest/isObject';
import { FINGERPRINT } from './constants';
import { sortKeys } from './sortKeys';

const {
	brightRed,
	brightYellow,
	grey,
	reset,
	white,
} = colors;

// Avoid type errors
declare module globalThis {
  var app: App
  var log: Log
  var __: DoubleUnderscore
}

function colorize(a: unknown[]) {
  return a.map(i => reset(stringify(i, { maxItems: Infinity })));
}

globalThis.__ = {
  // @ts-ignore
  newBean: (bean: string) => {
    if (bean === 'lib.enonic.libStatic.AppHelper') {
      return {
        isDevMode: () => false,
        getFingerprint: (application: string) => {
          console.info(`getFingerprint application:${application}`);
          return FINGERPRINT
        },
      };
    }
    throw new Error(`Unmocked bean:${bean}!`);
  },
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
};

globalThis.app = {
  name: 'com.example.myproject',
  config: {},
  version: '1.0.0'
};

globalThis.log = {
  // debug: () => {},
  // error: () => {},
  // info: () => {},
  // warning: () => {},
  // @ts-ignore
  debug: (format: string, ...s: unknown[]): void => {
    if (s.length) {
      console.debug(grey(`DEBUG ${format}`), ...colorize(s));
    } else {
      console.debug(grey(`DEBUG ${format}`));
    }
  },
  // @ts-ignore
  error: (format: string, ...s: unknown[]): void => {
    if (s.length) {
      console.debug(brightRed(`ERROR ${format}`), ...colorize(s));
    } else {
      console.error(brightRed(`ERROR ${format}`));
    }
  },
  // @ts-ignore
  info: (format: string, ...s: unknown[]): void => {
    if (s.length) {
      console.debug(white(`INFO  ${format}`), ...colorize(s));
    } else {
      console.info(white(`INFO  ${format}`));
    }
  },
  // @ts-ignore
  warning: (format: string, ...s: unknown[]): void => {
    if (s.length) {
      console.debug(brightYellow(`WARN  ${format}`), ...colorize(s));
    } else {
      console.warn(brightYellow(`WARN  ${format}`));
    }
  },
}

const BASEURL_WEBAPP = `/webapp/${app.name}`;
const BASEURL = BASEURL_WEBAPP;

mock.module('/lib/xp/portal', () => ({
  assetUrl: (({
    params,
    // path
  }: AssetUrlParams) => {
    const query = params ? `?${new URLSearchParams(params as Record<string,string>).toString()}` : '';
    // if (params) {
    //   return `${BASEURL}/_/asset/${app.name}:${FINGERPRINT}/?string=string&number=0&boolean=true&array=two&array=three&array=one`;
    // }
    return `${BASEURL}/_/asset/${app.name}:${FINGERPRINT}${query}`;
  }),
}));
