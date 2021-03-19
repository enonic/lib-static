const ioService = __.newBean('lib.enonic.libStatic.IoService');

exports.getMimeType = (name) => {
    return ioService.getMimeType(name);
};

exports.getResource = (key) => {
    const res = ioService.getResource(key);
    return new Resource(res);
};

exports.readText = (stream) => {
    return ioService.readText(stream);
};

function Resource(native) {
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
