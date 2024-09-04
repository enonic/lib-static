import type {
  ByteSource,
  Resource as ResourceInterface,
  // ResourceKey
} from '@enonic-types/lib-io';

export class Resource implements ResourceInterface {
  private readonly _bytes: string; // ByteSource
  private readonly _exists: boolean;
  private readonly _key: string;
  private readonly _isDirectory: boolean;
  private readonly _size: number; // ResourceKey
  private readonly _timestamp: number;

  constructor({
    bytes,
    exists,
    isDirectory = false,
    key,
    size,
    timestamp,
  }: {
    bytes: string
    exists: boolean
    key: string
    isDirectory?: boolean
    size: number
    timestamp: number
  }) {
    this._bytes = bytes;
    this._exists = exists;
    this._key = key;
    this._isDirectory = isDirectory;
    this._size = size;
    this._timestamp = timestamp;
  }

  public exists(): boolean {
    return this._exists;
  }

  public getBytes(): string {
    return this._bytes;
  }

  public getSize(): number {
    return this._size;
  }

  public getStream(): ByteSource {
    // throw new Error(`getStream called key:${JSON.stringify(this._key, null, 4)}`);
    return this._bytes as unknown as ByteSource;
  }

  public getTimestamp(): number {
    return this._timestamp;
  }

  public isDirectory(): boolean {
    return this._isDirectory;
  }

  public readString(): string {
    return this._bytes;
  }
}
