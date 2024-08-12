import {
  beforeAll,
  describe,
  expect,
  jest,
  test as it
} from '@jest/globals';
import { mockJava } from '../mockJava';
import { buildRequest } from '../expectations';


beforeAll((done) => {
  mockJava({
    devMode: true,
  });
  jest.mock('/lib/xp/io', () => ({
  }), { virtual: true });
  done();
});


describe('static service', () => {
  it('returns 400 Bad Request when the request path contains illegal chars <', () => {
    const appName = 'com.example.myproject'; // globalThis.app.name
    const routingUnderWebapp = 'assets';
    const contextPath = `/webapp/${appName}`
    const filename = '<';
    const encodedFileName = '%3C';
    // const unVhostedPath = `/webapp/${appName}/${routingUnderWebapp}/${filename}`;
    const vhostedPath = `/mapping/${routingUnderWebapp}/${encodedFileName}`;
    const request = buildRequest({
      contextPath,
      path: vhostedPath,
      rawPath: `${contextPath}/assets/${filename}`
    });
    import('../../main/resources/lib/enonic/static/service/handleResourceRequest').then(({ handleResourceRequest }) => {
      expect(handleResourceRequest({request})).toEqual({
        body: "can't contain '..' or any of these characters: \\ | ? * < > ' \" ` ´",
        contentType: 'text/plain; charset=utf-8',
        status: 400
      }); // expect
    }); // import
  }); // it
});
