import { isDev } from '/lib/enonic/static/runMode';


export const getResponse404 = (path: string) => {
  if (!isDev()) {
    log.warning(`Not found: ${JSON.stringify(path)}`);
  }
  return (isDev())
    ? {
      status: 404,
      body: `Not found: ${path}`,
      contentType: 'text/plain; charset=utf-8'
    }
    : {
      status: 404
    }
}
