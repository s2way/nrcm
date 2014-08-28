var WaferPie = require('./src/WaferPie');
var wafer = new WaferPie();
wafer.configure('config.json');
wafer.setUp('sample');
wafer.start('0.0.0.0', 8001);