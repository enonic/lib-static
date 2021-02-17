// Dev/prod mode detected by separate module/method in order to be mockable.
let isProd = !Java.type('com.enonic.xp.server.RunMode')
    .get()
    .toString()
    .toUpperCase()
    .startsWith('DEV');
if (!isProd) {
    log.info("XP dev mode detected, lib-static will act accordingly (see README).");
}
exports.isProd = () => isProd;
