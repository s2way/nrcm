/*jslint devel: true, node: true, indent: 4, vars: true, maxlen: 256 */
'use strict';
/**
 * This class verifies if an url was passed in the format configured,
 * it also creates an json object to make the reading easier
 *
 * Format example: /#prefix1/#prefix2/$application/$controller
 */
var url = require('url');
var path = require('path');

/**
 * The router object
 *
 * @constructor
 * @method Router
 * @param {string} urlFormat The string that represents how you will send the urls to the server,
 * check the example above
 */
function Router(logger, urlFormat) {
    this.logger = logger;
    this.urlFormat = urlFormat;
    this.urlFormatParts = urlFormat.substring(1).split('/');
    this.info('Router created');
}

Router.prototype.info = function (msg) {
    this.logger.info('[Router] ' + msg);
};

/**
 * It checks if the url received by the server was formatted according to the configuration
 *
 * @method isValid
 * @param {string} requestUrl The requested url received by the server
 * @return {boolean} Returns true if succeed or false if failed
 */
Router.prototype.isValid = function (requestUrl) {
    var parsedUrl = url.parse(requestUrl, true).pathname;
    var startsWithSlash = parsedUrl.charAt(0) !== '/';
    var endsWithSlash = parsedUrl.charAt(parsedUrl.length - 1) === '/';
    var noExtension = path.extname(parsedUrl) !== '';
    var formatContainsApplication = this.urlFormat.indexOf('$application') !== -1;
    var formatContainsController = this.urlFormat.indexOf('$controller') !== -1;

    if (noExtension) {
        this.info('Extension is not allowed');
        return false;
    }
    if (endsWithSlash) {
        parsedUrl = parsedUrl.substring(0, parsedUrl.length - 1);
    }
    if (startsWithSlash) {
        this.info('URL does not start with /');
        return false;
    }
    var urlNumParts = parsedUrl.substring(1).split('/').length;

    var requiredParts = this.urlFormatParts.length;
    if (formatContainsApplication) {
        requiredParts -= 1;
    }
    if (formatContainsController) {
        requiredParts -= 1;
    }
    if (urlNumParts < requiredParts) {
        this.info('URL parts do not match the specified format');
        return false;
    }
    return true;
};

/**
 * It decomposes the url
 *
 * @method decompose
 * @param {string} requestUrl The requested url received by the server
 * @return {object} Returns a splited json object of the url
 */
Router.prototype.decompose = function (requestUrl) {
    this.info('Decomposing URL');
    var parsedUrl = url.parse(requestUrl, true);
    var path = parsedUrl.pathname;
    var parts = path.substring(1).split('/');
    var i;
    var prefixes = {};
    var controller = '';
    var application = 'app';
    var segments = [];
    var part, urlFormatPart, formatPartFirstChar;
    var type = 'root';
    for (i in parts) {
        if (parts.hasOwnProperty(i)) {
            part = parts[i];
            if (part) {
                urlFormatPart = this.urlFormatParts[i];
                if (urlFormatPart !== undefined) {
                    formatPartFirstChar = urlFormatPart.charAt(0);
                    if (formatPartFirstChar === '#') {
                        prefixes[urlFormatPart.substring(1)] = part;
                    } else if (urlFormatPart === '$controller') {
                        type = 'controller';
                        controller = part;
                    } else if (urlFormatPart === '$application') {
                        if (type === 'root') {
                            type = 'appRoot';
                        }
                        application = part;
                    }
                } else {
                    segments.push(part);
                }
            }
        }
    }
    this.info('URL decomposed');
    return {
        'type' : type,
        'controller' : controller,
        'application' : application,
        'prefixes' : prefixes,
        'query' : parsedUrl.query,
        'segments' : segments
    };
};

module.exports = Router;