'use strict';

var chalk = require('chalk');
var path = require('path');

/**
 * Logger component constructor
 * @param fileName The name of the file where the logs are going to be stored
 * @constructor
 */
function Logger(fileName) {
    this.fileName = fileName || 'default.log';
    this._winston = require('winston');
}

/**
 * Initializes the component
 * @param logsPath
 */
Logger.prototype.init = function (logsPath) {
    logsPath = logsPath || path.join(this.constants.logsPath);
    this._logger = new this._winston.Logger({
        transports: [
            new (this._winston.transports.Console)({ json: false, timestamp: true, level: 'debug' }),
            new this._winston.transports.File({ filename: path.join(logsPath, this.fileName), json: false })
        ],
        exitOnError: false
    });
};

/**
 * Blue information message
 * @param message
 */
Logger.prototype.info = function (message) {
    this._logger.info(chalk.blue(message));
};

/**
 * Normal debug message
 * @param message
 */
Logger.prototype.debug = function (message) {
    this._logger.debug(message);
};

/**
 * Normal information message
 * @param message
 */
Logger.prototype.message = function (message) {
    this._logger.info(message);
};

/**
 * Red error message
 * @param message
 */
Logger.prototype.error = function (message) {
    this._logger.error(chalk.red(message));
};

/**
 * Yellow warning message
 * @param message
 */
Logger.prototype.warn = function (message) {
    this._logger.warn(chalk.yellow(message));
};

module.exports = Logger;
