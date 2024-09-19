import type {StepDefinitions} from 'jest-cucumber';
import type {
	Request,
  RequestHandlerParams,
	Response,
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


// Avoid type errors
declare namespace globalThis {
  let app: App
  let log: Log
  let __: DoubleUnderscore
  let _devMode: boolean;
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
  // and,
  given,
  then,
  when,
}) => {
  let request: Partial<Request> = {};
  let response: Response;
  const params: RequestHandlerParams = {};

  given('enonic xp is running in development mode', () => {
    globalThis._devMode = true;
  });

  given('enonic xp is running in production mode', () => {
    globalThis._devMode = false;
  });

  given('the following resources:', (table: {
    content: string
    exist: string
    etag: string
    path: string
    type: string
  }[]) => {
    Object.keys(globalThis._resources).forEach((key) => {
      delete globalThis._resources[key];
    });
    table.forEach(({path, exist, type, etag, content}) => {
      globalThis._resources[path] = {
        exists: exist !== 'false',
      };
      if (content) {
        globalThis._resources[path].bytes = content;
      }
      if (etag) {
        globalThis._resources[path].etag = etag;
      }
      if (type) {
        globalThis._resources[path].mimeType = type;
      }
    });
    // log.info('resources:%s', globalThis._resources);
	});

  given('the following request:', (table: {property: string, value: string}[]) => {
    request = {};
    table.forEach(({property, value}) => {
      request[property] = value;
    });
    params.request = request;
	});

  given('the following request headers:', (table: {header: string, value: string}[]) => {
    request.headers = {};
    table.forEach(({header, value}) => {
      request.headers[header] = value;
    });
    params.request = request;
	});

  when('the resources are info logged', () => {
    log.info('resources:%s', globalThis._resources);
	});

  when('the request is info logged', () => {
    log.info('request:%s', request);
	});

  when('requestHandler is called', () => {
    response = requestHandler(params);
	});

  when('requestHandler is called with the following parameters:', (table: {param: string, value: string}[]) => {
    table.forEach(({param, value}) => {
      params[param] = value;
    });
    response = requestHandler(params);
  });

  then('the response is info logged', () => {
    log.info('response:%s', response);
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
      expect(response.headers[header]).toStrictEqual(v);
    });
	});

  then(/^the response body should start with "(.*)"$/, (prefix) => {
    expect((response.body as string).startsWith(prefix)).toBe(true);
  });

}; // steps

autoBindSteps(feature, [steps]);
