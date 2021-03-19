exports.isDev = () => Java.type('com.enonic.xp.server.RunMode').get().toString() !== 'PROD';
