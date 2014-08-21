/*jslint devel: true, node: true, indent: 4, vars: true, maxlen: 256 */
'use strict';
// Dependencies
var querystring = require('querystring');
var util = require('util');
var aclModule = require('./../Core/acl');
var exceptions = require('./../exceptions');
var stringUtils = require('./../Util/stringUtils');
var Router = require('./../Core/Router');
var ComponentFactory = require('./../Component/ComponentFactory');
var ModelFactory = require('./../Model/ModelFactory');
var DataSource = require('./../Model/DataSource');

/**
 * The request handler object
 *
 * @constructor
 * @method RequestHandler
 * @param {json} configs
 * @param {json} applications
 * @param {object} ExceptionsController
 */
function RequestHandler(serverLogger, configs, applications, ExceptionsController, version) {
    this.applications = applications;
    this.configs = configs;
    this.isAllowed = aclModule.isAllowed;
    this.ExceptionsController = ExceptionsController;
    this.start = new Date();
    this.serverLogger = serverLogger;
    this.version = version;
    this.info('RequestHandler created');
}

/**
 * It processes every request received
 *
 * @method process
 * @param {object} request The nodejs request object
 * @param {object} response The nodejs response object
 */
RequestHandler.prototype.process = function (request, response) {
    var $this = this;
    this.request = request;
    this.response = response;
    this.extension = '.json';
    this.rule = null;
    this.payload = '';

    var requestUrl = this.request.url;
    this.info('---------------------------------------------------------------------------------------------------');
    this.info('Request: ' + requestUrl);
    this.info('---------------------------------------------------------------------------------------------------');

    try {
        var router = new Router(this.serverLogger, this.configs.urlFormat);

        if (!router.isValid(requestUrl)) {
            throw new exceptions.InvalidUrl();
        }

        var decomposedURL = router.decompose(requestUrl);
        var type = decomposedURL.type;
        var method = this.request.method.toLowerCase();
        this.appName = decomposedURL.application;

        if (type !== 'root') {
            this.application = this.appName ? this.applications[this.appName] : null;
            if (this.applications[this.appName] === undefined) {
                throw new exceptions.ApplicationNotFound(this.appName);
            }
            this.acl = this.application.acl;
        }

        this.query = decomposedURL.query;
        this.prefixes = decomposedURL.prefixes;
        this.segments = decomposedURL.segments;
        var controller = decomposedURL.controller;

        this.info('Application: ' + this.appName);
        this.info('Controller: ' + controller);
        this.info('Method: ' + method);
        this.info('URL type: ' + type);
        this.info('Prefixes: ' + JSON.stringify(this.prefixes));
        this.info('Query: ' + JSON.stringify(this.query));
        this.info('Segments: ' + JSON.stringify(this.segments));

        if (type === 'controller') {
            var rule = this.isAllowed(this.acl, 'admin', controller, method);
            this.rule = rule;

            this.info('Rule: ' + rule);

            if (rule === false) {
                throw new exceptions.Forbidden();
            }

            var controllerNameCamelCase = stringUtils.lowerCaseUnderscoredToCamelCase(decomposedURL.controller);
            var controllerInstance = this.prepareController(controllerNameCamelCase);
            this.invokeController(controllerInstance, method);

        } else if (type === 'appRoot') {
            this._receivePayload();
            this._endRequest(function () {
                $this.render({
                    'application' : $this.appName,
                    'version' : $this.application.core.version
                }, 200);
            });
        } else if (type === 'root') {
            this._receivePayload();
            this._endRequest(function () {
                $this.render({
                    'version' : $this.version
                }, 200);
            });
        }

    } catch (e) {
        this.handleRequestException(e);
    }
};

/**
 * Prepares the controller to be invoked
 * Controller dependency injection happens here
 * @return The controller instance that should be passed to invokeController
 */
RequestHandler.prototype.prepareController = function (controllerName) {
    var that = this;
    this.debug('prepareController()');

    var application = that.applications[that.appName];
    var dataSourceName, dataSourceConfig;
    var dataSources = [];

    // Instantiate all DataSources
    this.info('Creating DataSources');
    for (dataSourceName in application.core.dataSources) {
        if (application.core.dataSources.hasOwnProperty(dataSourceName)) {
            dataSourceConfig = application.core.dataSources[dataSourceName];
            dataSources[dataSourceName] = new DataSource(this.serverLogger, dataSourceName, dataSourceConfig);
        }
    }
    that.dataSources = dataSources;

    this.info('Creating factories');
    this.componentFactory = new ComponentFactory(this.serverLogger, application);
    this.modelFactory = new ModelFactory(this.serverLogger, application, this.dataSources, this.componentFactory);

    if (application.controllers[controllerName] === undefined) {
        that.debug('controller not found');
        throw new exceptions.ControllerNotFound();
    }

    var ControllerConstructor = application.controllers[controllerName];
    // Instantiate the controller
    this.info('Creating controller');
    var controllerInstance = new ControllerConstructor();

    controllerInstance.name = controllerName;
    controllerInstance.application = that.appName;
    controllerInstance.logger = application.logger;
    // Injects the application core JSON Properties
    controllerInstance.core = application.core;

    // Injects the method for retrieving components in the controller and inside each component
    controllerInstance.component = function (componentName) {
        return that.componentFactory.create(componentName);
    };

    // Injects the method for retrieving models
    controllerInstance.model = function (modelName) {
        return that.modelFactory.create(modelName);
    };

    return controllerInstance;
};

RequestHandler.prototype._receivePayload = function () {
    var that = this;
    this.request.on('data', function (data) {
        that.debug('on data');
        that.payload += data;
    });
};

RequestHandler.prototype._endRequest = function (callback) {
    this.request.on('end', callback);
};

// Return the request headers
RequestHandler.prototype._headers = function () {
    return this.request.headers;
};

// Set the response headers
RequestHandler.prototype._setHeader = function (name, value) {
    this.response.setHeader(name, value);
};

RequestHandler.prototype._writeHead = function (statusCode, contentType) {
    this.response.writeHead(statusCode, { 'Content-Type' : contentType });
};

RequestHandler.prototype._writeResponse = function (output) {
    this.response.write(output);
};

RequestHandler.prototype._sendResponse = function () {
    this.response.end();
};

/**
 * It executes a function within the controller
 *
 * @method invokeController
 * @param {string} controller The controller's name
 * @param {string} method The controller`s method that should be invoked
 */
RequestHandler.prototype.invokeController = function (controllerInstance, httpMethod, done) {
    var that = this;
    that.info('Invoking controller');

    var savedOutput = null;
    var application = that.applications[that.appName];

    if (controllerInstance[httpMethod] === undefined) {
        that.debug('http method not found');
        throw new exceptions.MethodNotFound();
    }

    // Receiving data
    that.info('Receiving payload');
    this._receivePayload();

    // All data received
    this._endRequest(function () {
        that.info('All data received');
        try {
            controllerInstance.payload = JSON.parse(that.payload);
        } catch (e) {
            controllerInstance.payload = querystring.parse(that.payload);
        }
        controllerInstance.segments = that.segments;
        controllerInstance.query = that.query;
        controllerInstance.prefixes = that.prefixes;
        controllerInstance.readonly = {
            'request' : that.request,
            'response' : that.response
        };
        controllerInstance.requestHeaders = that._headers();
        controllerInstance.responseHeaders = {
            'X-Powered-By' : 'NRCM'
        };

        var timer;

        var afterCallback = function () {
            that.debug('afterCallback()');
            // Done, clear the timeout
            clearTimeout(timer);

            var name, dataSourceNameAC, dataSourceAC, value;
            try {
                if (controllerInstance.statusCode === undefined) {
                    controllerInstance.statusCode = 200;
                }
                // Seta os headers
                if (typeof controllerInstance.responseHeaders === 'object') {
                    for (name in controllerInstance.responseHeaders) {
                        if (controllerInstance.responseHeaders.hasOwnProperty(name)) {
                            value = controllerInstance.responseHeaders[name];
                            that._setHeader(name, value);
                        }
                    }
                }
                that.info('Shutting down connections');
                // Shutdown all connections
                for (dataSourceNameAC in that.dataSources) {
                    if (that.dataSources.hasOwnProperty(dataSourceNameAC)) {
                        dataSourceAC = that.dataSources[dataSourceNameAC];
                        dataSourceAC.disconnect();
                    }
                }
                that.render(
                    savedOutput,
                    controllerInstance.statusCode
                );
                if (typeof done === 'function') {
                    done();
                }
            } catch (e) {
                that.handleRequestException(e);
            }
        };
        var controllerMethodCallback = function (output) {
            that.debug('controllerMethodCallback()');
            savedOutput = output;
            try {
                // If after() is defined, call it
                if (controllerInstance.after !== undefined) {
                    that.debug('controllerInstance.after()');
                    controllerInstance.after(afterCallback);
                } else {
                    afterCallback();
                }
            } catch (e) {
                // Clear the timer if an exception occurs because handleRequestException will respond
                clearTimeout(timer);
                that.handleRequestException(e);
            }
        };
        var beforeCallback = function () {
            that.debug('beforeCallback()');
            try {
                // Call the controller method (put, get, delete, post, etc)
                savedOutput = controllerInstance[httpMethod](controllerMethodCallback);
            } catch (e) {
                // Clear the timer if an exception occurs because handleRequestException will respond
                clearTimeout(timer);
                that.handleRequestException(e);
            }
        };

        // Encapsulate the method in a immediate so it can be killed
        var controllerMethodImmediate = setImmediate(function () {
            that.debug('controllerMethodImmediate()');
            try {
                // If before() is defined, call it
                if (controllerInstance.before !== undefined) {
                    that.debug('controllerInstance.before()');
                    controllerInstance.before(beforeCallback);
                } else {
                    beforeCallback();
                }
            } catch (e) {
                // Catch exceptions that may occur in the controller before method
                clearTimeout(timer);
                that.handleRequestException(e);
            }
        });

        that.info('Timeout timer started');
        // Timer that checks if the
        timer = setTimeout(function () {
            that.debug('Request timeout!');
            clearImmediate(controllerMethodImmediate);
            that.handleRequestException(new exceptions.Timeout());
        }, application.core.requestTimeout);
    });
};

RequestHandler.prototype.info = function (message) {
    this.serverLogger.info('[RequestHandler] ' + message);
};

RequestHandler.prototype.debug = function (message) {
    this.serverLogger.debug('[RequestHandler] ' + message);
};
/**
 * It handles the exceptions
 *
 * @method handleRequestException
 * @param {object} e The error
 * @return {mixed} Returns false if it is an undefined exception or it will render the exception
 */
RequestHandler.prototype.handleRequestException = function (e) {
    this.info('Handling exception');
    // Known exceptions
    if (e.name !== undefined) {
        var $this = this;
        var method = 'on' + e.name;
        this.info('Creating ExceptionsController instance');
        var instance = new this.ExceptionsController();
        instance.statusCode = 200;
        var callback = function (output) {
            if (instance.statusCode === undefined) {
                instance.statusCode = 200;
            }
            $this.info('Rendering exception');
            return $this.render(output, instance.statusCode);
        };
        if (typeof instance[method] === 'function') {
            instance[method](callback);
        } else if (instance.onGeneral !== undefined) {
            instance.onGeneral(callback, e);
        } else {
            console.log(e);
            if (e.stack !== undefined) {
                console.log(e.stack);
            }
            return;
        }
        this.info('Exception ' + e.name + ' handled');
    } else { // Unknown exceptions: no response
        this.info('Unknown Exception: ' + e);
        if (e.stack !== undefined) {
            this.info(e.stack);
        }
    }
    return false;
};
/**
 * The callback function that sends the response back to the client
 *
 * @method render
 * @param {object} output The body/payload data
 * @param {number} statusCode The status code for http response
 * @param {string} contentType The text for the Content-Type http header
 */
RequestHandler.prototype.render = function (output, statusCode, contentType) {
    if (this.stringOutput === undefined) {
        this.info('Rendering');
        var extensionsMapToContentType = {
            '.htm' : 'text/html',
            '.html' : 'text/html',
            '.json' : 'application/json',
            '.js' : 'application/json',
            '.xml' : 'text/xml'
        };
        // If the content type has not been specified, use the extension
        if (contentType === undefined) {
            if (!this.extension) {
                contentType = 'application/json';
            } else {
                contentType = extensionsMapToContentType[this.extension];
            }
        }
        this.info('Content-Type: ' + contentType);
        this._writeHead(statusCode, contentType);
        if (typeof output === 'object') {
            this.stringOutput = JSON.stringify(output);
        } else {
            this.stringOutput = output;
        }
        this._writeResponse(this.stringOutput);
        this.info('Output: ' + (this.stringOutput.length > 1000 ? this.stringOutput.substring(0, 1000) + '...' : this.stringOutput));
        this._sendResponse();
        this.end = new Date();
        this.info('---------------------------------------------------------------------------------------------------');
        this.info('Time: ' + (this.end.getTime() - this.start.getTime()) + 'ms');
        this.info('---------------------------------------------------------------------------------------------------');
    }
    return this.stringOutput;
};

module.exports = RequestHandler;
