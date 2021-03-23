const ioMock = __.newBean('lib.enonic.libStatic.IoMock');

exports.getMimeType = (name) => {
    return ioMock.getMimeType(name);
};

exports.readText = (stream) => {
    return ioMock.readText(stream);
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

// Test use only
exports.getResource = (key, exists, content) => {
    const dummy = ioMock.getResource(app.name+":"+key, !(exists===false), content);
    return new Resource(dummy);
}
