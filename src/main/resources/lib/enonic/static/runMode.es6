const IS_DEV = Java.type('com.enonic.xp.server.RunMode').get().toString() !== 'PROD';
exports.isDev = () => IS_DEV;
