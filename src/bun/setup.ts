import type {ScriptValue} from '@enonic-types/core';
import type {App, DoubleUnderscore, Log} from '../jest/global.d';

import {
  // expect,
  // jest,
  mock,
  // test as it
} from 'bun:test';
import {stringify} from 'q-i';
import {isObject} from '../jest/isObject';
// import {Resource} from '../jest/Resource';
import {mockEtagService} from '../jest/mocks/etagService';
import {mockIoService} from '../jest/mocks/ioService';


// Avoid type errors
declare namespace globalThis {
  let app: App
  let log: Log
  let __: DoubleUnderscore
  let _devMode: boolean;
  let _logLevel: 'debug' | 'error' | 'info' | 'warn' | 'silent';
  let _resources: Record<string, {
    bytes?: string
    exists?: boolean
    etag?: string
    mimeType?: string
  }>
}

globalThis._resources = {
  '/com.enonic.lib.static.json': {
    exists: false,
  },
};

globalThis.app = {
  name: 'com.example.myproject',
  config: {},
  version: '1.0.0',
};

const wrap = (code: number): string => `\u001b[${code}m`;
const reset = wrap(0);
// const bold = wrap(1);
// const dim = wrap(2);
// const italic = wrap(3);
// const underline = wrap(4);
// const inverse = wrap(7);
// const hidden = wrap(8);
// const strikethrough = wrap(9);
// const black = wrap(30);
// const red = wrap(31);
const green = wrap(32);
const yellow = wrap(33);
const blue = wrap(34);
const magenta = wrap(35);
// const cyan = wrap(36);
const white = wrap(37);
const grey = wrap(90);
const brightRed = wrap(91);
// const brightGreen = wrap(92);
const brightYellow = wrap(93);
// const brightBlue = wrap(94);
// const brightMagenta = wrap(95);
// const brightCyan = wrap(96);
// const brightWhite = wrap(97);

/* coverage ignore start */
function colorize(a: unknown[], color = brightYellow): string[] {
  return a.map(i => {
    if (typeof i === 'string') {
      return `${green}${i}${color}`;
    }
    if (typeof i === 'undefined') {
      return `${yellow}undefined${color}`;
    }
    if (i === null) {
      return `${yellow}null${color}`;
    }
    if (typeof i === 'boolean') {
      return `${magenta}${i}${color}`;
    }
    if (typeof i === 'number') {
      return `${blue}${i}${color}`;
    }
    return `${reset}${stringify(i, {maxItems: Infinity})}${color}`;
  });
}

export function rpad(
	s = '',
	w = 2,
	z = ' ',
): string {
	return s.length >= w
		? s
		: s + new Array(w - s.length + 1).join(z);
}

export function logWith({
  color,
  level = globalThis._logLevel || 'silent',
  name,
  prefix = name,
  format,
  pad = 6,
  values,
}: {
  color: string
  level?: 'debug' | 'error' | 'info' | 'warn' | 'silent'
  name: 'debug' | 'error' | 'info' | 'warn'
  prefix?: string
  pad?: number
  format: string
  values: unknown[]
}): void {
  if (
    level === 'silent' ||
    (level === 'info' && name === 'debug') ||
    (level === 'warn' && (name === 'debug' || name === 'info')) ||
    (level === 'error' && (name === 'debug' || name === 'info' || name === 'warn'))
  ) {
    return;
  }
  const p = `${color}${rpad(prefix, pad)}${format}${reset}`;
  if (values.length) {
    console[name](p, ...colorize(values, color));
  } else {
    console[name](p);
  }
}

export const testLogger = {
  debug: (format: string, ...s: unknown[]): void => {
    logWith({
      color: grey,
      name: 'debug',
      prefix: '[BUN TEST DEBUG]',
      level: 'debug',
      pad: 16,
      format,
      values: s,
    });
  },
  info: (format: string, ...s: unknown[]): void => {
    logWith({
      color: white,
      name: 'info',
      prefix: '[BUN TEST INFO]',
      level: 'info',
      pad: 16,
      format,
      values: s,
    });
  },
};
/* coverage ignore end */


globalThis.log = {
  // debug: () => {},
  // error: () => {},
  // info: () => {},
  // warning: () => {},
  debug: (format: string, ...s: unknown[]): void => {
    logWith({
      color: grey,
      name: 'debug',
      prefix: 'DEBUG',
      format,
      values: s,
    });
  },
  error: (format: string, ...s: unknown[]): void => {
    logWith({
      color: brightRed,
      name: 'error',
      prefix: 'ERROR',
      format,
      values: s,
    });
  },
  info: (format: string, ...s: unknown[]): void => {
    logWith({
      color: white,
      name: 'info',
      prefix: 'INFO',
      format,
      values: s,
    });
  },
  warning: (format: string, ...s: unknown[]): void => {
    logWith({
      color: brightYellow,
      name: 'warn',
      prefix: 'WARN',
      format,
      values: s,
    });
  },
}

globalThis.__ = {
  // @ts-expect-error I'm too lazy to fix this
  newBean: (bean: string) => {
    if (bean === 'lib.enonic.libStatic.AppHelper') {
      return {
        isDevMode: () => globalThis._devMode,
      };
    }
    if (bean === 'lib.enonic.libStatic.etag.EtagService') {
      return mockEtagService();
    }
    if (bean === 'lib.enonic.libStatic.IoService') {
      return mockIoService();
    }
    throw new Error(`Unmocked bean:${bean}!`);
  },
  nullOrValue: <T>(v: T): T => {
    log.debug(`nullOrValue value:${JSON.stringify(v, null, 4)}`);
    return v;
  },
  toNativeObject: <T>(v: T): T => {
    // log.debug(`toNativeObject value:${JSON.stringify(v, null, 4)}`);
    if (
      isObject(v)
      // && v['etag'] === '"1234567890abcdef"'
    ) {
      return v as T;
    }
    throw new Error(`toNativeObject: Unmocked value:${JSON.stringify(v, null, 4)}!`);
  },
  toScriptValue: <T>(v: T): ScriptValue => {
    log.debug(`toScriptValue value:${JSON.stringify(v, null, 4)}`);
    return v as ScriptValue;
  },
};
