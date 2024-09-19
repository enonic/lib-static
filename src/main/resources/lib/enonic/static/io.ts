import type {
  ByteSource,
  ResourceKey,
} from '/lib/xp/io';
import type {LibStaticResourceInterface} from '/lib/enonic/static/types';


export class LibStaticResource implements LibStaticResourceInterface {
  private readonly native: LibStaticResourceInterface;

  constructor(native: LibStaticResourceInterface) {
    this.native = native;
  }

  public exists(): boolean {
    return this.native.exists();
  }

  /* coverage ignore start */
  public getBytes(): ByteSource {
    return this.native.getBytes();
  }

  public getKey(): ResourceKey {
    return this.native.getKey();
  }

  public getSize(): number {
    return this.native.getSize();
  }
  /* coverage ignore end */

  public getStream(): ByteSource {
    return this.native.getBytes();
  }

  /* coverage ignore start */
  public getTimestamp(): number {
    return this.native.getTimestamp();
  }

  public readString(): string {
    return this.native.readString();
  }
  /* coverage ignore end */

} // class LibStaticResource


const ioService = __.newBean<{
  getMimeType: (name: string) => string,
  getResource: (key: string) => LibStaticResource,
  // readText: (stream: ByteSource) => string,
}>('lib.enonic.libStatic.IoService');

export const getMimeType = (name: string): string => {
    return ioService.getMimeType(name);
};

export const getResource = (key: string): LibStaticResource => {
    const native = ioService.getResource(key);
    return new LibStaticResource(native);
};

// export const readText = (stream: ByteSource) => {
//     return ioService.readText(stream);
// };
