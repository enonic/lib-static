import type {
  ByteSource,
  ResourceKey
} from '@enonic-types/lib-io';
import type { Log } from '../global.d';

import { Resource } from '../Resource';


// Avoid type errors
declare module globalThis {
  var log: Log
}


export function mockIoService({
  resources = {}
}: {
  resources?: Record<string, {
    bytes?: string
    exists?: boolean
    etag?: string
    isDirectory?: boolean
    mimeType?: string
  }>
}) {
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
          isDirectory: () => resource.isDirectory,
        };
      }

      return new Resource({
        bytes: resource.bytes || '',
        exists: true,
        key: key.toString(),
        isDirectory: resource.isDirectory,
        size: (resource.bytes || '').length,
        timestamp: 2
      });
    }, // getResource
    readText: (_stream: ByteSource) => {
      return _stream as unknown as string;
    }
  }
}
