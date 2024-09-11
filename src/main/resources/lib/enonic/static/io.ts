import type {
  ByteSource,
  Resource as ResourceInterface,
  ResourceKey
} from '/lib/xp/io';

const ioService = __.newBean<{
  getMimeType: (name: string|ResourceKey) => string,
  getResource: (key: string|ResourceKey) => ResourceInterface,
  readText: (stream: ByteSource) => string,
  isDirectory: (key: string|ResourceKey) => boolean,
}>('lib.enonic.libStatic.IoService');

export const getMimeType = (name: string|ResourceKey) => {
    return ioService.getMimeType(name);
};

export const getResource = (key: string|ResourceKey) => {
    const res = ioService.getResource(key);
    return new Resource(res);
};

export const readText = (stream: ByteSource) => {
    return ioService.readText(stream);
};

export const isDirectory = (key: string | ResourceKey) => {
  return ioService.isDirectory(key);
};

function Resource(native: ResourceInterface) {
    this.res = native;
}

Resource.prototype.getStream = function () {
    return this.res.getBytes();
};

Resource.prototype.getSize = function () {
    return this.res.getSize();
};

Resource.prototype.exists = function () {
    return this.res.exists();
};

Resource.prototype.readString = function () {
    return this.res.readString();
};
