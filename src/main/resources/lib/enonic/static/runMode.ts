// const IS_DEV = Java.type('com.enonic.xp.server.RunMode').get().toString() !== 'PROD';

const helper = __.newBean<{
  isDevMode: () => boolean
}>('lib.enonic.libStatic.AppHelper');
export const isDev = () => helper.isDevMode();
