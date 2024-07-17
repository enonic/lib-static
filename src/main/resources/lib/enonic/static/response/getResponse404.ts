import { isDev } from '/lib/enonic/static/runMode';
import { notFoundResponse } from '/lib/enonic/static/response/responses';

export const getResponse404 = (path: string) => {
  if (!isDev()) {
    log.warning(`Not found: ${JSON.stringify(path)}`);
  }
  return (isDev())
    ? notFoundResponse({
      body: `Not found: ${path}`,
      contentType: 'text/plain; charset=utf-8'
    })
    : notFoundResponse()
}
