'use strict';

var chalk = require('chalk');
var path = require('path');
var fs = require('fs');

/**
 * Logger component constructor
 * @param fileName The name of the file where the logs are going to be stored
 * @constructor
 */
function Logger(fileName) {
    this._fileName = fileName || 'default.log';
    this._enabled = true;
    this._stream = null;
    this._configs = {
        'console' : false
    };
}

/**
 * Set the logger configurations
 * @param {object} configs
 */
Logger.prototype.config = function (configs) {
    this._configs = configs;
};

/**
 * Initializes the component
 * @param {string=} logsPath
 */
Logger.prototype.init = function () {
    var fullPath, logsPath;

    logsPath = this._configs.path || path.join(this.constants.logsPath);
    this.fullPath = path.join(logsPath, this._fileName);

};

/**
 * Print the message to the buffer
 * @private
 */
Logger.prototype._print = function (message) {
    this._stream = fs.createWriteStream(this.fullPath, {
        'flags' : 'a+',
        'encoding': 'UTF8'
    });
    this._stream.write(message + '\n');
    this._stream.end();

    if (this._configs.console === true) {
        console.log(message);
    }
};

/**
 * Format the message before printing it
 * @param {string} message The message to be formatted
 * @returns {string} The formatted message
 * @private
 */
Logger.prototype._format = function (message) {
    return new Date().toISOString() + ': ' + message;
};

/**
 * Enable the logs
 */
Logger.prototype.enable = function () {
    this._enabled = true;
};

/**
 * Disable the logs
 */
Logger.prototype.disable = function () {
    this._enabled = false;
};

(function () {
    var loggingMethods, methodName, color, logFunction;
    loggingMethods = {
        'info' : 'blue',
        'log' : null,
        'trace' : null,
        'error' : 'red',
        'warn' : 'yellow',
        'debug' : 'green'
    };
    logFunction = function (color) {
        return function (message) {
            var text = message;
            if (this._enabled) {
                if (color !== null) {
                    text = chalk[color](message);
                }
                this._print(this._format(text));
            }
        };
    };
    for (methodName in loggingMethods) {
        if (loggingMethods.hasOwnProperty(methodName)) {
            color = loggingMethods[methodName];
            Logger.prototype[methodName] = logFunction(color);
        }
    }
}());


module.exports = Logger;
