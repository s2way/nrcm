'use strict';

var RequestHandler = require('./RequestHandler');

function ControllerTesting() {
    this.configs = { };
    this.applications = {
        'app' : {
            'controllers' : { }
        }
    };
}

ControllerTesting.prototype.load = function (controllerName) {
    this.applications.app.controllers[controllerName] = this._require('../../test/Controller/' + controllerName);
};

ControllerTesting.prototype._require = function (path) {
    return require(path);
};

ControllerTesting.prototype.call = function (controller, method, options, callback) {
    var requestHandler = new RequestHandler(this.configs, this.applications, null);
    requestHandler.appName = 'app';
    requestHandler.invokeController(controller, method);

    this.controller = controller;
    this.method = method;
    this.options = options;
    this.callback = callback;
};

module.exports = ControllerTesting;