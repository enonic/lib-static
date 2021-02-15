const ioLib = require('/lib/xp/io');

exports.get = (path) => {
    // var type = ioLib.getMimeType(path);
    return {
        // contentType: type,
        body: ioLib.getResource(path).getStream()
    };
};
