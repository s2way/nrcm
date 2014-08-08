/*jslint devel: true, node: true, indent: 4, vars: true, maxlen: 256 */
'use strict';
/**
 * This class verifies if an url was passed in the format configured,
 * it also creates an json object to make the reading easier
 *
 * Format example: /#prefix1/#prefix2/$application/$controller
 */
var prefixRegex = /\#[a-z0-9]*/;
var applicationRegex = /\$application/;
var controllerRegex = /\$controller/;
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
 * It checks if the url received by the server was formated according to the configuration
 *
 * @method isValid
 * @param {string} requestUrl The requested url received by the server
 * @return {boolean} Returns true if succeed or false if failed
 */
Router.prototype.isValid = function (requestUrl) {
    var parsedUrl = url.parse(requestUrl, true).pathname;
    // This version does not allow extension at this moment
    if (path.extname(parsedUrl) !== '') {
        this.info('Extension is not allowed');
        return false;
    }
    // Remove / at the end of the URL
    if (parsedUrl.charAt(parsedUrl.length - 1) === '/') {
        parsedUrl = parsedUrl.substring(0, parsedUrl.length - 1);
    }
    // Must start with /
    if (parsedUrl.charAt(0) !== '/') {
        this.info('URL does not start with /');
        return false;
    }
    var parts = parsedUrl.substring(1).split('/');
    // The number of parameters must be equal or greater than specified in the format
    if (parts.length < this.urlFormatParts.length) {
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
                        controller = part;
                    } else if (urlFormatPart === '$application') {
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
        'controller' : controller,
        'application' : application,
        'prefixes' : prefixes,
        'query' : parsedUrl.query,
        'segments' : segments
    };
};

module.exports = Router;