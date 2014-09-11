'use strict';

/**
 * Http client constructor
 * @param {object} options Client options, including port, hostname and request contentType
 * @constructor
 */
function Http(options) {
    options = options || {};
    this._host = options.host || 'localhost';
    this._hostname = options.hostname;
    this._port = options.port || 80;
    this._http = require('http');
    this._contentType = options.contentType || 'application/json';
}

/**
 * Set the headers that will be sent in all subsequent requests
 * @param {object} headers
 */
Http.prototype.setHeaders = function (headers) {
    this._headers = headers;
};

/**
 * Perform a GET request
 * @param {string} resource URL resource (must start with /)
 * @param {function} callback Function that will be called after completion. Two parameters are passed, error and response.
 */
Http.prototype.get = function (resource, callback) {
    this.request({
        'method' : 'get',
        'resource' : resource
    }, callback);
};

/**
 * Perform a PUT request
 * @param {string} resource URL resource (must start with /)
 * @param {object} payload JSON payload (will be sent urlencoded if the contentType is application/x-www-form-urlencoded)
 * @param {function} callback Function that will be called after completion. Two parameters are passed, error and response.
 */
Http.prototype.put = function (resource, payload, callback) {
    this.request({
        'method' : 'put',
        'resource' : resource,
        'payload' : payload
    }, callback);
};

/**
 * Perform a POST request
 * @param {string} resource URL resource (must start with /)
 * @param {object} payload JSON payload (will be sent urlencoded if the contentType is application/x-www-form-urlencoded)
 * @param {function} callback Function that will be called after completion. Two parameters are passed, error and response.
 */
Http.prototype.post = function (resource, payload, callback) {
    this.request({
        'method' : 'post',
        'resource' : resource,
        'payload' : payload
    }, callback);
};

/**
 * Perform a DELETE request
 * @param {string} resource URL resource (must start with /)
 * @param {object} payload JSON payload (will be sent urlencoded if the contentType is application/x-www-form-urlencoded)
 * @param {function} callback Function that will be called after completion. Two parameters are passed, error and response.
 */
Http.prototype.delete = function (resource, callback) {
    this.request({
        'method' : 'delete',
        'resource' : resource
    }, callback);
};

Http.prototype._toUrlEncoded = function (object) {
    var key, url = '';
    for (key in object) {
        if (object.hasOwnProperty(key)) {
            if (url !== '') {
                url += '&';
            }
            url += encodeURIComponent(key) + '=' + encodeURIComponent(object[key]);
        }
    }
    return url;
};

Http.prototype._parseUrlEncoded = function (url) {
    var parts, object = {};
    parts = url.split('&');
    parts.forEach(function (part) {
        var name, value, nameValue;
        nameValue = part.split('=');
        name = decodeURIComponent(nameValue[0]);
        value = decodeURIComponent(nameValue[1]);
        object[name] = value;
    });
    return object;
};

/**
 * Perform a HTTP request
 * @param {object} options May include method, headers and resource
 * @param {function} callback
 */
Http.prototype.request = function (options, callback) {
    var $this, request, payload = false;

    if (options.payload) {
        if (this._contentType === 'application/x-www-form-urlencoded') {
            payload = this._toUrlEncoded(options.payload);
        } else {
            payload = options.payload;
        }
    }

    $this = this;
    request = this._http.request({
        'hostname' : this._hostname,
        'host' : this._host,
        'port' : this._port,
        'headers' : this._headers,
        'method' : options.method,
        'path' : options.resource
    }, function (response) {
        var responseObject, responseBody = '';
        response.on('data', function (chunk) {
            responseBody += chunk;
        });
        response.on('end', function () {
            var responseContentType, isJSON, isUrlEncoded;

            responseContentType = response.headers['Content-Type'] || $this._contentType;
            isJSON = responseContentType.indexOf('application/json') !== -1;
            isUrlEncoded = responseContentType.indexOf('application/x-www-form-urlencoded') !== -1;

            if (isJSON) {
                responseObject = responseBody === '' ? null : JSON.parse(responseBody);
            } else if (isUrlEncoded) {
                responseObject = $this._parseUrlEncoded(responseBody);
            } else {
                responseObject = responseBody;
            }
            callback(null, {
                'statusCode': response.statusCode,
                'body': responseObject,
                'headers': response.headers
            });
        });
    });
    request.setHeader('Content-Type', $this._contentType);
    request.on('error', function (error) {
        callback(error);
    });
    if (payload) {
        request.write(payload);
    }
    request.end();

};

module.exports = Http;