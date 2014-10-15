'use strict';

var XML = require('./XML');
var url = require('url');

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
    this._maxRedirects = options.maxRedirects || 100;
    this._secureProtocol = options.secureProtocol || '';
    this._agent = options.agent || '';
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

Http.prototype._parsePayload = function (options) {
    var isXML, isUrlEncoded, payload = false;
    if (options.payload) {

        isUrlEncoded = this._contentType.indexOf('application/x-www-form-urlencoded') !== -1;
        isXML = this._contentType.indexOf('text/xml') !== -1;

        if (isUrlEncoded) {
            payload = this._toUrlEncoded(options.payload);
        } else if (isXML) {
            payload = new XML().fromJSON(options.payload);
        } else {
            payload = options.payload;
        }
    }
    return payload;
};

/**
 * Perform a HTTP redirection overriding the options.host and incrementing the redirect counter
 * @param {string} location Location header (host to direct)
 * @param {object} options Http.request() options original parameter
 * @param {function} callback Http.request() callback original parameter
 * @param {number} redirectCounter Http.request() redirectCounter original parameter
 * @private
 */
Http.prototype._redirect = function (location, options, callback, redirectCounter) {
    var urlParts = url.parse(location);
    options.host = urlParts.host;
    delete options.hostname;
    delete options.port;
    this.request(options, callback, redirectCounter + 1);
};

/**
 * Perform a HTTP request
 * @param {object} options May include method, headers and resource
 * @param {function} callback
 * @param {number=} redirectCounter
 */
Http.prototype.request = function (options, callback, redirectCounter) {
    var $this, request, resource, headers, payload;
    redirectCounter = redirectCounter || 0;
    payload = this._parsePayload(options);

    resource = options.resource;
    headers = options.headers || this._headers || {};

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
        'path' : resource,
        'secureProtocol' : this._secureProtocol,
        'agent' : this._agent
    }, function (response) {
        var responseObject, responseBody = '';
        response.on('data', function (chunk) {
            responseBody += chunk;
        });
        response.on('end', function () {
            var responseContentType, isJSON, isUrlEncoded, isXML, isRedirect, locationHeader;
            responseContentType = response.headers['content-type'] || $this._contentType;
            isJSON = responseContentType.indexOf('application/json') !== -1;
            isUrlEncoded = responseContentType.indexOf('application/x-www-form-urlencoded') !== -1;
            isXML = responseContentType.indexOf('text/xml') !== -1;

            if (isJSON) {
                responseObject = responseBody === '' ? null : JSON.parse(responseBody);
            } else if (isUrlEncoded) {
                responseObject = $this._parseUrlEncoded(responseBody);
            } else if (isXML) {
                responseObject = new XML().toJSON(responseBody);
            } else {
                responseObject = responseBody;
            }

            isRedirect = response.statusCode >= 300 && response.statusCode < 400;
            locationHeader = response.headers.location !== undefined ? response.headers.location : false;

            if (isRedirect && locationHeader) {
                if (redirectCounter > $this._maxRedirects) {
                    callback({
                        'name' : 'TooManyRedirects'
                    });
                } else {
                    $this._redirect(locationHeader, options, callback, redirectCounter);
                }
            } else {
                callback(null, {
                    'statusCode': response.statusCode,
                    'body': responseObject,
                    'headers': response.headers
                });
            }
        });
    });
    request.setHeader('content-type', $this._contentType);
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