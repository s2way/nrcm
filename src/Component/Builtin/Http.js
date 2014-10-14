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
    this._contentType = options.contentType || 'application/json';
    this._protocol = require('http');
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
 * @param {object} options
 * @param {function} callback Function that will be called after completion. Two parameters are passed, error and response.
 */
Http.prototype.get = function (resource, options, callback) {
    options.method = 'get';
    options.resource = resource;
    this.request(options, callback);
};

/**
 * Perform a PUT request
 * @param {string} resource URL resource (must start with /)
 * @param {object} options Object that may contain a payload property (will be sent urlencoded if the contentType is application/x-www-form-urlencoded) and the query property (query string that will be appended to the resource)
 * @param {function} callback Function that will be called after completion. Two parameters are passed, error and response.
 */
Http.prototype.put = function (resource, options, callback) {
    options.method = 'put';
    options.resource = resource;
    this.request(options, callback);
};

/**
 * Perform a POST request
 * @param {string} resource URL resource (must start with /)
 * @param {object} options
 * @param {function} callback Function that will be called after completion. Two parameters are passed, error and response.
 */
Http.prototype.post = function (resource, options, callback) {
    options.method = 'post';
    options.resource = resource;
    this.request(options, callback);
};

/**
 * Perform a DELETE request
 * @param {string} resource URL resource (must start with /)
 * @param {object} options
 * @param {function} callback Function that will be called after completion. Two parameters are passed, error and response.
 */
Http.prototype.delete = function (resource, options, callback) {
    options.method = 'delete';
    options.resource = resource;
    this.request(options, callback);
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
    var $this, request, resource, headers, payload = false;

    if (options.payload) {
        if (this._contentType === 'application/x-www-form-urlencoded') {
            payload = this._toUrlEncoded(options.payload);
        } else {
            payload = options.payload;
        }
    }
    resource = options.resource;
    headers = options.headers || this._headers;

    if (options.query) {
        resource += '?' + this._toUrlEncoded(options.query);
    }

    $this = this;
    request = this._protocol.request({
        'hostname' : this._hostname,
        'host' : this._host,
        'port' : this._port,
        'headers' : headers,
        'method' : options.method,
        'path' : resource
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
        if (typeof payload === 'object') {
            request.write(JSON.stringify(payload));
        } else {
            request.write(payload);
        }
    }
    request.end();

};

module.exports = Http;