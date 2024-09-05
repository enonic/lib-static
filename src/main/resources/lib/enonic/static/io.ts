import type {
  ByteSource,
  ResourceKey
} from '/lib/xp/io';
import type { LibStaticResourceInterface } from '/lib/enonic/static/types';


export class LibStaticResource implements LibStaticResourceInterface {
  private readonly native: LibStaticResourceInterface;

  constructor(native: LibStaticResourceInterface) {
    this.native = native;
  }

  public exists(): boolean {
    return this.native.exists();
  }

  public getBytes(): ByteSource {
    return this.native.getBytes();
  }

  public getSize(): number {
    return this.native.getSize();
  }

  public getStream(): ByteSource {
    return this.native.getBytes();
  }

  public getTimestamp(): number {
    return this.native.getTimestamp();
  }

  public isDirectory(): boolean {
    // return false;
    return this.native.isDirectory();
  }

  public readString(): string {
    return this.native.readString();
  }
} // class LibStaticResource


const ioService = __.newBean<{
  getMimeType: (name: string|ResourceKey) => string,
  getResource: (key: string|ResourceKey) => LibStaticResource,
  isDirectory: (key: string|ResourceKey) => boolean,
  readText: (stream: ByteSource) => string,
}>('lib.enonic.libStatic.IoService');

export const getMimeType = (name: string|ResourceKey) => {
    return ioService.getMimeType(name);
};

export const getResource = (key: string|ResourceKey) => {
    const native = ioService.getResource(key);
    return new LibStaticResource(native);
};

export const readText = (stream: ByteSource) => {
    return ioService.readText(stream);
};
