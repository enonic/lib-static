import type {
  ByteSource,
  Resource as ResourceInterface
} from '@enonic-types/lib-io';


export interface LibStaticResourceInterface extends ResourceInterface {
  getBytes: () => ByteSource
  isDirectory: () => boolean
  readString: () => string
}
