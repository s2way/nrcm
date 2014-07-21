'use strict';
var path = require('path');
var RequestHandler = require('./RequestHandler');

function ControllerTesting(applicationPath) {
    this.applicationPath = applicationPath;
    this.configs = { };
    this.applications = {
        'app' : {
            'controllers' : { }
        }
    };
}

ControllerTesting.prototype._require = function (path) {
    return require(path);
};

ControllerTesting.prototype.call = function (controllerName, httpMethod, options, callback) {
    var controllerPath = path.join(this.applicationPath, 'src', 'Controller', controllerName);
    this.applications.app.controllers[controllerName] = this._require(controllerPath);

    var requestHandler = new RequestHandler(this.configs, this.applications, null);

    // Mock some RequestHandler methods
    requestHandler._endRequest = function (callback) {
        setImmediate(callback);
    };
    var blankFunction = function () {
        return;
    };

    // Return the request headers
    requestHandler._headers = function () {
        return [];
    };

    requestHandler._receivePayload = function () {
        if (options.payload === undefined) {
            this.payload = '';
        } else if (typeof options.payload === 'object') {
            this.payload = options.payload === null ? '' : JSON.stringify(options.payload);
        } else {
            this.payload = options.payload.toString();
        }
    };

    requestHandler.handleRequestException = function (e) {
        throw e;
    };

    // Set the response headers
    requestHandler._setHeader = blankFunction;
    requestHandler._writeHead = blankFunction;
    requestHandler._writeResponse = blankFunction;
    requestHandler._sendResponse = blankFunction;
    requestHandler.info = blankFunction;
    requestHandler.debug = blankFunction;

    if (options.query !== undefined) {
        requestHandler.query = options.query;
    } else {
        requestHandler.query = { };
    }

    requestHandler.appName = 'app';
    var instance = requestHandler.prepareController(controllerName);
    requestHandler.invokeController(instance, httpMethod, function () {
        callback(JSON.parse(requestHandler.stringOutput));
    });
    this.options = options;
};

module.exports = ControllerTesting;