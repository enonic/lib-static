import { describe } from '@jest/globals';
import {
  expect,
  test as it
} from 'bun:test';
import { assetUrl } from '../../../../main/resources/lib/enonic/asset/assetUrl';
import { FINGERPRINT } from '../../../constants';


describe('assetUrl', async () => {
  it("returns url with fingerprint", async () => {
      expect(assetUrl({
        application: 'com.example.another',
        params: {
          array: [ 'one', 'two', 'three' ],
          boolean: true,
          number: 0,
          string: 'string',
        },
        path: '200.css',
        type: 'absolute'
      })).toStrictEqual(
        `/webapp/com.example.myproject/_/service/com.example.another/asset/${FINGERPRINT}/200.css?array=one%2Ctwo%2Cthree&boolean=true&number=0&string=string`
      );
  }); // it
}); // describe
