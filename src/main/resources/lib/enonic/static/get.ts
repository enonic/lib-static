import type {
  BuildGetterParams,
  BuildGetterParamsWithPath,
} from '/lib/enonic/static/types';

import { read } from '/lib/enonic/static/etagReader';
import { parsePathAndOptions } from '/lib/enonic/static/options';
import { getPathError } from '/lib/enonic/static/path/getPathError';
import { getResourceOr400 } from '/lib/enonic/static/response/getResourceOr400';
import { getResponse404 } from '/lib/enonic/static/response/getResponse404';
import { getResponse200 } from '/lib/enonic/static/response/getResponse200';
import { errorLogAndResponse500 } from '/lib/enonic/static/response/errorLogAndResponse500';


// export function get(path: string, options?: BuildGetterParams): (req: Request) => Response;
// export function get(optionsWithPath: BuildGetterParamsWithPath): (req: Request) => Response;
export function get(pathOrOptions: string|BuildGetterParamsWithPath, options?: BuildGetterParams) {

  let {
    path,
    cacheControlFunc,
    contentTypeFunc,
    etagOverride,
    throwErrors,
    errorMessage
  } = parsePathAndOptions(pathOrOptions, options);


  try {
    if (errorMessage) {
      throw Error(errorMessage);
    }

    path = path.replace(/^\/+/, '');

    let pathError = getPathError(path);
    pathError = pathError
      ? `Resource path '${path}' ${pathError}`
      : undefined;
    log.debug('get: pathError: %s', pathError);

    path = `/${path}`;
    log.debug('get: path: %s', path);

    const { resource, response400 } = getResourceOr400(path, pathError);
    if (response400) {
      return response400;
    }
    if (!resource) {
      return getResponse404(path);
    }


    const etag = read(path, etagOverride);
    log.debug('get: etag: %s', etag);

    return getResponse200(path, resource, contentTypeFunc, cacheControlFunc, etag);

  } catch (e) {
    return errorLogAndResponse500(e, throwErrors, pathOrOptions, options, 'get', 'Path');
  }
}