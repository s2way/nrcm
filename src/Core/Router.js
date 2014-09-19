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
var StringUtils = require('./../Component/Builtin/StringUtils');

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
    this.stringUtils = new StringUtils();
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
 * Try to find a matching controller for the given decomposed url in the controllers list
 * @param {object} controllers List of controllers loaded by the application
 * @param {object} decomposedUrl Decomposed URL returned by Router.decompose()
 * @return {string|boolean} The matching controller and its segments or false if none is found
 */
Router.prototype.findController = function (controllers, decomposedUrl) {
    var i;
    var controllerName;
    var controllersArrayReverted;
    var controllersArray = [];
    var controllerNameCamelCase;

    for (controllerName in decomposedUrl.controllers) {
        if (decomposedUrl.controllers.hasOwnProperty(controllerName)) {
            controllersArray.push(controllerName);
        }
    }
    controllersArrayReverted = controllersArray.reverse();
    for (i in controllersArrayReverted) {
        if (controllersArrayReverted.hasOwnProperty(i)) {
            controllerName = controllersArrayReverted[i];
            controllerNameCamelCase = this.stringUtils.lowerCaseUnderscoredToCamelCase(controllerName.replace(/\//g, '.'));
            if (controllers[controllerNameCamelCase] !== undefined) {
                return {
                    'controller' : controllerNameCamelCase,
                    'segments' : decomposedUrl.controllers[controllerName].segments
                };
            }
        }
    }
    return false;
};

/**
 * It decomposes the url
 *
 * @method decompose
 * @param {string} requestUrl The requested url received by the server
 * @return {object} Returns a splitted json object of the url
 */
Router.prototype.decompose = function (requestUrl) {
    this.info('Decomposing URL');
    var parsedUrl = url.parse(requestUrl, true);
    var path = parsedUrl.pathname;
    var parts = path.substring(1).split('/');
    var prefixes = {};
    var controllers = {};
    var controllerAppended = '';
    var application = 'app';
    var urlFormatPart, formatPartFirstChar;
    var type = 'root';
    var i = 0;
    var $this = this;
    parts.forEach(function (part) {
        if (part) {
            urlFormatPart = $this.urlFormatParts[i];
            if (urlFormatPart !== undefined) {
                formatPartFirstChar = urlFormatPart.charAt(0);
                if (formatPartFirstChar === '#') {
                    prefixes[urlFormatPart.substring(1)] = part;
                } else if (urlFormatPart === '$controller') {
                    type = 'controller';
                    controllers[part] = {
                        'segments' : parts.slice(i + 1)
                    };
                    controllerAppended = part;
                } else if (urlFormatPart === '$application') {
                    if (type === 'root') {
                        type = 'appRoot';
                    }
                    application = part;
                }
            } else {
                controllerAppended += '/' + part;
                controllers[controllerAppended] = {
                    'segments' : parts.slice(i + 1)
                };
            }
        }
        i += 1;
    });
    this.info('URL decomposed');
    return {
        'type' : type,
        'controllers' : controllers,
        'application' : application,
        'prefixes' : prefixes,
        'query' : parsedUrl.query
    };
};

module.exports = Router;