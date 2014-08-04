'use strict';
var winston = require('winston');
var path = require('path');

function Logger(logsPath) {
    this.logger = new winston.Logger({
        transports: [
            new (winston.transports.Console)({ json: false, timestamp: true, level: 'debug' }),
            new winston.transports.File({ filename: path.join(logsPath, 'main.log'), json: false }),
        ],
        exceptionHandlers: [
            new (winston.transports.Console)({ json: false, timestamp: true }),
            new winston.transports.File({ filename: path.join(logsPath, 'exceptions.log'), json: false })
        ],
        exitOnError: false
    });
}

Logger.prototype.info = function (message) {
    return this.logger.info(message);
};

Logger.prototype.debug = function (message) {
    return this.logger.debug(message);
};

module.exports = Logger;
