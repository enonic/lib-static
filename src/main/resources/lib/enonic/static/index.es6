const taggingReader = require('/lib/enonic/static/etaggingResourceReader');
const optionsParser = require('/lib/enonic/static/options');

exports.get = (pathOrOptions, options) => {
    const {
        path,
        cacheControlFunc,
        contentTypeFunc,
        etagOverride,
        throwErrors,
        errorMessage
    } = optionsParser.parsePathAndOptions(pathOrOptions, options);

    try {
        if (errorMessage) {
            throw Error(errorMessage);
        }

        const { status, body, etagValue } = taggingReader.read(path, etagOverride);

        if (status < 300) {
            const contentType = contentTypeFunc(path, body);
            const headers = {
                'Cache-Control': cacheControlFunc(path, body, contentType),
                'ETag': etagValue
            };

            return { status, body, contentType, headers };

        } else {
            return {
                status,
                body,
                contentType: "text/plain",
            }
        }

    } catch (e) {
        if (!throwErrors) {
            const errorID = Math.floor(Math.random() * 1000000000000000).toString(36);

            let serverErrorMessage = `lib-static.get, error ID: ${errorID}   |   ${e.message}`;

            if (typeof pathOrOptions === 'string') {
                serverErrorMessage += `  |   path = ${JSON.stringify(pathOrOptions)}`;
                if (options !== undefined) {
                    serverErrorMessage += '   |   options = ' + JSON.stringify(options);
                }

            } else {
                serverErrorMessage += `  |   optionsWithPath = ${JSON.stringify(pathOrOptions)}`;
            }

            log.error(serverErrorMessage);

            return {
                status: 500,
                contentType: "text/plain",
                body: `Server error, logged with error ID: ${errorID}`
            }

        } else {
            throw e;
        }
    }
};
