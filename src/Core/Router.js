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
var logger = require('./../Util/logger');

/**
 * The router object
 *
 * @constructor
 * @method Router
 * @param {string} urlFormat The string that represents how you will send the urls to the server,
 * check the example above
 */
function Router(urlFormat) {
    this.urlFormat = urlFormat;
    this.urlFormatParts = urlFormat.split('/');
    this.info('Router created');
}

Router.prototype.info = function (msg) {
    logger.info('[Router] ' + msg);
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
    var parts = parsedUrl.split('/');
    // The number of parameters must be the same of the format
    if (parts.length !== this.urlFormatParts.length) {
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
    var parts = path.split('/');
    var i = 0;
    var prefixes = {};
    var controller = '';
    var application = 'app';
    var that = this;
    parts.forEach(function (part) {
        if (part && i > 0) {
            var urlFormatPart = that.urlFormatParts[i];
            var formatPartFirstChar = urlFormatPart.charAt(0);
            if (formatPartFirstChar === '#') {
                prefixes[urlFormatPart.substring(1)] = part;
            } else if (urlFormatPart === '$controller') {
                controller = part;
            } else if (urlFormatPart === '$application') {
                application = part;
            }
        }
        i += 1;
    });
    this.info('URL decomposed');
    return {
        'controller' : controller,
        'application' : application,
        'prefixes' : prefixes,
        'query' : parsedUrl.query
    };
};

module.exports = Router;