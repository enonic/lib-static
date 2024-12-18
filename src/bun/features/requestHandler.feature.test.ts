import type {StepDefinitions} from 'jest-cucumber';
import type {
	Request,
	Response,
} from '@enonic-types/core';
import type {
  RequestHandlerOptions,
} from '../../main/resources/lib/enonic/static/types';
import type {App, DoubleUnderscore, Log} from '../../jest/global.d';

import {describe} from '@jest/globals';
import {
  expect,
  test,
} from 'bun:test';
import {
  autoBindSteps,
  loadFeature,
} from 'jest-cucumber';
import {requestHandler} from '../../main/resources/lib/enonic/static/service/requestHandler';
import {spaNotFoundHandler} from '../../main/resources/lib/enonic/static/service/spaNotFoundHandler';
import {mappedRelativePath} from '../../main/resources/lib/enonic/static';
import {testLogger} from '../setup';


// Avoid type errors
declare namespace globalThis {
  let app: App
  let log: Log
  let __: DoubleUnderscore
  let _devMode: boolean;
  let _logLevel: 'debug' | 'info' | 'warn' | 'error' | 'silent';
  let _resources: Record<string, {
    bytes?: string
    exists?: boolean
    etag?: string
    mimeType?: string
  }>
}

const feature = loadFeature('./src/bun/features/requestHandler.feature', {
  runner: {
    describe,
    test,
  },
});

export const steps: StepDefinitions = ({
  and,
  given,
  then,
  when,
}) => {
  let request: Request = {} as Request;
  let response: Response;
  let options: RequestHandlerOptions = {};

  given('enonic xp is running in development mode', () => {
    globalThis._devMode = true;
  });

  given('enonic xp is running in production mode', () => {
    globalThis._devMode = false;
  });

  given(/^loglevel is set to "(.*)"$/, (level) => {
    globalThis._logLevel = level;
  });

  given('the following resources:', (table: {
    content: string
    exist: string
    etag: string
    mimeType: string
    path: string
    type: string
  }[]) => {
    Object.keys(globalThis._resources).forEach((key) => {
      delete globalThis._resources[key];
    });
    table.forEach(({path, exist, type, etag, content, mimeType}) => {
      globalThis._resources[path] = {
        exists: exist !== 'false',
      };
      if (content) {
        globalThis._resources[path].bytes = content;
      }
      if (etag) {
        globalThis._resources[path].etag = etag;
      }
      if (mimeType) {
        globalThis._resources[path].mimeType = mimeType;
      }
      if (type) {
        globalThis._resources[path].mimeType = type;
      }
    });
    // log.info('resources:%s', globalThis._resources);
	});

  given('the request is reset', () => {
    request = {} as Request;
  });

  given('the options are reset', () => {
    options = {};
  });

  given('the following request:', (table: {property: string, value: string}[]) => {
    request = {} as Request;
    table.forEach(({property, value}) => {
      request[property] = value;
    });
	});

  given('the following request headers:', (table: {header: string, value: string}[]) => {
    request.headers = {};
    table.forEach(({header, value}) => {
      request.headers[header] = value;
    });
	});

  and(/the request header "(.+)" is "(.+)"$/, (header: string, value: string) => {
    if (!request.headers) {
      request.headers = {};
    }
    request.headers[header] = value;
  });

  when('the resources are info logged', () => {
    testLogger.info('resources:%s', globalThis._resources);
	});

  when('the request is info logged', () => {
    testLogger.info('request:%s', request);
	});

  given('the spaNotFoundHandler is used', () => {
    options.notFound = spaNotFoundHandler;
  });

  when('requestHandler is called', () => {
    response = requestHandler(request, options);
	});

  when(/^requestHandler is called with mappedRelativePath "(.*)"$/, (base) => {
    options.relativePath = mappedRelativePath(base);
    response = requestHandler(request, options);
  });

  when('requestHandler is called with the following options:', (table: {option: string, value: string}[]) => {
    table.forEach(({option, value}) => {
      let v: unknown = value;
      if (option === 'staticCompress') {
        v = value === 'true';
      }
      options[option] = v;
    });
    response = requestHandler(request, options);
  });

  then('the response is info logged', () => {
    testLogger.info('response:%s', response);
	});

  then('the response should have the following properties:', (table: {property: string, value: string}[]) => {
    table.forEach(({property, value}) => {
      // if (value === 'undefined') {
      //   value = undefined;
      // }
      if (property === 'status') {
        expect(response[property]).toStrictEqual(Number.parseInt(value));
      } else if (property === 'body') {
        expect(response[property]).toStrictEqual(value);
        // const stream = response[property];
        // const text = readText(stream);
        // expect(text).toStrictEqual(value);
      } else {
        expect(response[property]).toStrictEqual(value);
      }
    });
	});

  then('the response should have the following headers:', (table: {header: string, value: string}[]) => {
    table.forEach(({header, value}) => {
      let v: unknown = value;
      if (value === 'undefined') {
        v = undefined;
      }
      // if (value === 'null') {
      //   value = null;
      // }
      expect(response.headers[header]).toStrictEqual(v as string | number | (string | number)[]);
    });
	});

  then(/^the response body should start with "(.*)"$/, (prefix) => {
    expect((response.body as string).startsWith(prefix)).toBe(true);
  });

}; // steps

autoBindSteps(feature, [steps]);
