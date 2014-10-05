/*jslint devel: true, node: true, indent: 4, vars: true, maxlen: 256 */
'use strict';
var exceptions = require('./../../exceptions');
var os = require('os');

/**
 * @constructor
 */
function SystemInfo() {
    this.data = {'os' : {}, 'node' : {}};
    this.refresh();
}

/**
 * Refresh the whole information about the server, it always refresh everything because of virtualization that could
 * change the cpus/route/memory/etc.
 *
 * @method refresh
 * @return {json}
 */
SystemInfo.prototype.refresh = function () {
    this.data.os.totalMenInMB = os.totalmem() / 1024 / 1024;
    this.data.os.freeMenInMB = os.freemem() / 1024 / 1024;
    this.data.os.uptimeInDays = os.uptime() / 3600 / 24;
    this.data.os.hostName = os.hostname();
    this.data.os.platform = os.platform();
    this.data.os.loadAVG = os.loadavg();
    this.data.os.release = os.release();
    this.data.os.type = os.type();
    this.data.os.arch = os.arch();
    this.data.os.cpus = os.cpus();

    this.data.os.usedMenInMB = this.data.os.totalMenInMB - this.data.os.freeMenInMB;

    this.data.node.uptimeInDays = process.uptime() / 3600 / 24;
    this.data.node.moduleLoadList = process.moduleLoadList;
    this.data.node.memoryUsageInMB = process.memoryUsage();
    this.data.node.features = process.features;
    this.data.node.libsVer = process.versions;
    this.data.node.args = process.execArgv;
    this.data.node.config = process.config;
    this.data.node.uid = process.getuid();
    this.data.node.gid = process.getgid();
    this.data.node.env = process.env;
    this.data.node.pid = process.pid;

    this.data.node.memoryUsage.heapTotal = this.data.node.memoryUsage.heapTotal / 1024 / 1024;
    this.data.node.memoryUsage.heapUsed = this.data.node.memoryUsage.heapUsed / 1024 / 1024;
    this.data.node.memoryUsage.rss = this.data.node.memoryUsage.rss / 1024 / 1024;

    this.data.node.memoryUsage.heapFree = this.data.node.memoryUsage.heapTotal - this.data.node.memoryUsage.heapUsed;

    return this.data;
};

module.exports = SystemInfo;