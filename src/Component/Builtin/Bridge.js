'use strict';

var exceptions = require('../../exceptions');

/**
 * Create a new bridge to another WaferPie application
 * @param {string} bridgeName The name of the bridge configuration (should be located in the core.json)
 * @constructor
 */
function Bridge(bridgeName) {
    this._bridgeName = bridgeName;
}

/**
 * Initialize the bridge and instantiate the Http component
 * Will throw an exception if the bridge cannot be found
 */
Bridge.prototype.init = function () {
    var bridge = this.core.bridges[this._bridgeName];
    if (!bridge) {
        throw new exceptions.IllegalArgument('Bridge ' + this._bridgeName + ' not found!');
    }
    this._app = bridge.app || false;
    this._http = this.component('Http', bridge);
};

Bridge.prototype._insertApp = function (resource) {
    var newResource = '';
    if (resource.charAt(0) !== '/') {
        newResource += '/';
    }
    if (this._app) {
        newResource += this._app + '/';
    }
    return newResource + resource;
};

Bridge.prototype.get = function (resource, options, callback) {
    this._http.get(this._insertApp(resource), options, callback);
};

Bridge.prototype.put = function (resource, options, callback) {
    this._http.put(this._insertApp(resource), options, callback);
};

Bridge.prototype.delete = function (resource, options, callback) {
    this._http.delete(this._insertApp(resource), options, callback);
};

Bridge.prototype.post = function (resource, options, callback) {
    this._http.post(this._insertApp(resource), options, callback);
};


module.exports = Bridge;