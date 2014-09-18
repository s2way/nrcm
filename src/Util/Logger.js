'use strict';
var winston = require('winston');
var path = require('path');

function Logger(logsPath) {
    this._logger = new winston.Logger({
        transports: [
            new (winston.transports.Console)({ json: false, timestamp: true, level: 'debug' }),
            new winston.transports.File({ filename: path.join(logsPath, 'main.log'), json: false })
        ],
        exitOnError: false
    });
}

Logger.prototype.info = function (message) {
    return this._logger.info(message);
};

Logger.prototype.debug = function (message) {
    return this._logger.debug(message);
};

Logger.prototype.error = function (message) {
    return this._logger.error(message);
};

Logger.prototype.warn = function (message) {
    return this._logger.warn(message);
};

module.exports = Logger;
