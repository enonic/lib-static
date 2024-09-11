const t = require('/lib/xp/testing');
const ioLib = require('/lib/enonic/static/io');

exports.testIsDirectory = function () {
  t.assertEquals(true, ioLib.isDirectory('/test/testdir'));
  t.assertEquals(false, ioLib.isDirectory('/test/testdir/filename.txt'));
};
