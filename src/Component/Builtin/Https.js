'use strict';

/**
 * Https client constructor - it just wraps the Http component, injecting the needed functions
 * @param {object} options Client options, including port, hostname and request contentType
 * @constructor
 */
function Https(options) {
    this._options = options;
}

Https.prototype.init = function () {
    this._http = this.component('Http', this._options);
    this._http._protocol = require('https');
};

/**
 * Get the node's http library
 */
var methods = ['delete', 'get', 'put', 'post', 'request', 'setHeaders'];

methods.forEach(function (method) {
    Https.prototype[method] = function () {
        this._http[method].apply(this._http, arguments);
    };
});


module.exports = Https;