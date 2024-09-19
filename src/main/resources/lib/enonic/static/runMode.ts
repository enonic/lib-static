const helper = __.newBean<{
  isDevMode: () => boolean
}>('lib.enonic.libStatic.AppHelper');
export const isDev = (): boolean => helper.isDevMode();
