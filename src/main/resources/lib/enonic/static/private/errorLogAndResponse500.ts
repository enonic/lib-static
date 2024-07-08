import type {
  BuildGetterParams,
  BuildGetterParamsWithPath,
  BuildGetterParamsWithRoot
} from '../types';


/** Creates an easy-readable and trackable error message in the log,
 *  and returns a generic error message with a tracking ID in the response */
export const errorLogAndResponse500 = (
  e: Error,
  throwErrors: boolean,
  stringOrOptions: string | BuildGetterParamsWithPath | BuildGetterParamsWithRoot,
  options: BuildGetterParams | undefined,
  methodLabel: 'buildGetter#getStatic' | 'get',
  rootOrPathLabel: 'Root' | 'Path'
) => {
  if (!throwErrors) {
    const errorID = Math.floor(Math.random() * 1000000000000000).toString(36);

    let serverErrorMessage = `lib-static.${methodLabel}, error ID: ${errorID}   |   ${e.message}`;

    if (typeof stringOrOptions === 'string') {
      serverErrorMessage += `  |   ${rootOrPathLabel.toLowerCase()} = ${JSON.stringify(stringOrOptions)}`;
      if (options !== undefined) {
        serverErrorMessage += '   |   options = ' + JSON.stringify(options);
      }

    } else {
      serverErrorMessage += `  |   optionsWith${rootOrPathLabel} = ${JSON.stringify(stringOrOptions)}`;
    }

    log.error(serverErrorMessage, e);

    return {
      status: 500,
      contentType: "text/plain; charset=utf-8",
      body: `Server error (logged with error ID: ${errorID})`
    }

  } else {
    throw e;
  }
}
