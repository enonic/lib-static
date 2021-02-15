const ioLib = require('/lib/xp/io');

exports.get = (path) => {
    try {
        const res = ioLib.getResource(path);
        const exists = res.exists();

        if (exists) {
            const mimeType = ioLib.getMimeType(path);
            const stream = res.getStream();

            return {
                status: 200,
                contentType: mimeType,
                body: ioLib.readText(stream)
            };

        } else {
            return {
                status: 404,
                contentType: "text/plain",
                body: "Resource not found: " + path
            }
        }

    } catch (e) {
        const errorID = Math.floor(Math.random()*1000000000000000).toString(36);
        log.error(`lib-static, trying to GET resource by path '${path}'. Error ID: ${errorID}`, e);
        return {
            status: 500,
            contentType: "text/plain",
            body: `Server error, logged with error ID: ${errorID}`
        }
    }

};
