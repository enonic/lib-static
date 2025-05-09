import type {
  ByteSource,
  Resource as ResourceInterface
} from '@enonic-types/core';

export class Resource implements ResourceInterface {
  private readonly _bytes: string; // ByteSource
  private readonly _exists: boolean;
  private readonly _key: string;
  private readonly _size: number; // ResourceKey
  private readonly _timestamp: number;

  constructor({
    bytes,
    exists,
    key,
    size,
    timestamp,
  }: {
    bytes: string
    exists: boolean
    key: string
    size: number
    timestamp: number
  }) {
    this._bytes = bytes;
    this._exists = exists;
    this._key = key;
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

  public readString(): string {
    return this._bytes;
  }
}
