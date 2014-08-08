var NRCM = require('./src/NRCM');
var nrcm = new NRCM();
nrcm.configure('config.json');
nrcm.setUp('sample');
nrcm.start('0.0.0.0', 3333);