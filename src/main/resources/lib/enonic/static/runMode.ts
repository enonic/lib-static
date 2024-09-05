const helper = __.newBean<{
  isDevMode: () => boolean
  getFingerprint: (application: string) => string
}>('lib.enonic.libStatic.AppHelper');
export const isDev = () => helper.isDevMode();

export const getFingerprint = (application: string) => helper.getFingerprint(application);
