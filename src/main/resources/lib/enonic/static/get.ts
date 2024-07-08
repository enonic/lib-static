import type {
  BuildGetterParams,
  BuildGetterParamsWithPath,
} from '/lib/enonic/static/options';

import { read } from '/lib/enonic/static/etagReader';
import { parsePathAndOptions } from '/lib/enonic/static/options';
import { __getPathError__ } from '/lib/enonic/static/__getPathError__';
import { getResourceOr400 } from '/lib/enonic/static/private/getResourceOr400';
import { getResponse404 } from '/lib/enonic/static/private/getResponse404';
import { getResponse200 } from '/lib/enonic/static/private/getResponse200';
import { errorLogAndResponse500 } from '/lib/enonic/static/private/errorLogAndResponse500';


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

    let pathError = __getPathError__(path);
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
