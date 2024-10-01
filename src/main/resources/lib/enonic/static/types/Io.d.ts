import type {
  ByteSource,
  Resource as ResourceInterface,
  ResourceKey,
} from '@enonic-types/lib-io';


export interface LibStaticResourceInterface extends ResourceInterface {
  getBytes: () => ByteSource
  getKey: () => ResourceKey
  readString: () => string
}
