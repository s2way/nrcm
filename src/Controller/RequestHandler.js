/*jslint devel: true, node: true, indent: 4, vars: true, maxlen: 256 */
'use strict';
var querystring = require('querystring');
var util = require('util');
var exceptions = require('./../exceptions');
var Router = require('./../Core/Router');
var ComponentFactory = require('./../Component/ComponentFactory');
var ModelFactory = require('./../Model/ModelFactory');
var chalk = require('chalk');

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
 * @param {object} request The NodeJS request object
 * @param {object} response The NodeJS response object
 */
RequestHandler.prototype.process = function (request, response) {
    var $this = this;
    this.request = request;
    this.response = response;
    this.payload = '';

    var requestUrl = this.request.url;
    this.info(chalk.bold.green('Request: ' + requestUrl));

    try {
        var router = new Router(this.serverLogger, this.configs.urlFormat);

        if (!router.isValid(requestUrl)) {
            throw new exceptions.InvalidUrl();
        }

        var decomposedURL = router.decompose(requestUrl);
        var type = decomposedURL.type;
        this.method = this.request.method.toLowerCase();
        this.appName = decomposedURL.application;

        if (type !== 'root') {
            this.application = this.appName ? this.applications[this.appName] : null;
            if (this.applications[this.appName] === undefined) {
                throw new exceptions.ApplicationNotFound(this.appName);
            }
        }
        this.query = decomposedURL.query;
        this.prefixes = decomposedURL.prefixes;
        this.segments = decomposedURL.segments;

        this.info('Application: ' + this.appName);
        this.info('Method: ' + this.method);
        this.info('URL type: ' + type);
        this.info('Prefixes: ' + JSON.stringify(this.prefixes));
        this.info('Query: ' + JSON.stringify(this.query));

        if (type === 'controller') {
            var controllerInfo = router.findController(this.application.controllers, decomposedURL);
            var controllerNameCamelCase = controllerInfo.controller;
            this.segments = controllerInfo.segments;

            this.info('Segments: ' + JSON.stringify(this.segments));
            this.info('Controller: ' + controllerNameCamelCase);

            var controllerInstance = this.prepareController(controllerNameCamelCase);
            this.invokeController(controllerInstance, this.method);
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
 * @return {object|boolean} The controller instance that should be passed to invokeController
 */
RequestHandler.prototype.prepareController = function (controllerName) {
    var $this = this;
    var application = this.applications[this.appName];

    if (controllerName === false || application.controllers[controllerName] === undefined) {
        throw new exceptions.ControllerNotFound();
    }

    this.info('Creating factories');
    this.componentFactory = new ComponentFactory(this.serverLogger, application);
    this.modelFactory = new ModelFactory(this.serverLogger, application, this.componentFactory);

    this.info('Creating controller');
    var ControllerConstructor = application.controllers[controllerName];
    var controllerInstance = new ControllerConstructor();

    (function injectProperties() {
        var retrieveComponentMethod = function (componentName) {
            var instance = $this.componentFactory.create(componentName);
            $this.componentFactory.init(instance);
            return instance;
        };
        var retrieveModelMethod = function (modelName) {
            var instance = $this.modelFactory.create(modelName);
            $this.modelFactory.init(instance);
            return instance;
        };
        var automaticTraceImplementation = function (callback) {
            controllerInstance.contentType = false;
            var headerName;
            for (headerName in controllerInstance.requestHeaders) {
                if (controllerInstance.requestHeaders.hasOwnProperty(headerName)) {
                    controllerInstance.responseHeaders[headerName] = controllerInstance.requestHeaders[headerName];
                }
            }
            callback('');
        };
        var automaticOptionsImplementation = function (callback) {
            var methods = ['head', 'trace', 'options', 'get', 'post', 'put', 'delete'];
            var allowString = '';
            methods.forEach(function (method) {
                if (controllerInstance[method] !== undefined) {
                    if (allowString !== '') {
                        allowString += ',';
                    }
                    allowString += method.toUpperCase();
                }
            });
            controllerInstance.responseHeaders.Allow = allowString;
            controllerInstance.contentType = false;
            callback('');
        };

        controllerInstance.responseHeaders = { };
        controllerInstance.name = controllerName;
        controllerInstance.application = $this.appName;
        controllerInstance.logger = application.logger;
        controllerInstance.core = application.core;
        controllerInstance.component = retrieveComponentMethod;
        controllerInstance.model = retrieveModelMethod;
        controllerInstance.trace = automaticTraceImplementation;
        controllerInstance.options = automaticOptionsImplementation;
        controllerInstance.head = controllerInstance.get;
    }());

    return controllerInstance;
};

RequestHandler.prototype._receivePayload = function () {
    var $this = this;
    this.request.on('data', function (data) {
        $this.payload += data;
    });
};

RequestHandler.prototype._endRequest = function (callback) {
    this.request.on('end', callback);
};

/**
 * Return the request headers
 * This method is mocked in tests
 * @returns {object}
 * @private
 */
RequestHandler.prototype._headers = function () {
    return this.request.headers;
};

/**
 * Set a response header
 * @param {string} name Header name
 * This method is mocked in tests
 * @param {string} value Header value
 * @private
 */
RequestHandler.prototype._setHeader = function (name, value) {
    this.response.setHeader(name, value);
};

RequestHandler.prototype._writeHead = function (statusCode, contentType) {
    var headers = { };
    if (contentType) {
        headers['Content-Type'] = contentType;
    }
    this.response.writeHead(statusCode, headers);
};

RequestHandler.prototype._writeResponse = function (output) {
    var $this = this;
    var remainingOutput = output;

    (function sendOutputInChunks() {
        var segment;
        var SEGMENT_LENGTH = 1024;
        do {
            segment = remainingOutput.substring(0, SEGMENT_LENGTH);
            remainingOutput = remainingOutput.substring(SEGMENT_LENGTH);
            $this.response.write(segment);
        } while (remainingOutput.length > SEGMENT_LENGTH);
    }());
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
    var $this = this;
    $this.info('Invoking controller');

    var savedOutput = null;
    var application = this.applications[this.appName];

    if (controllerInstance[httpMethod] === undefined) {
        throw new exceptions.MethodNotFound();
    }

    $this.info('Receiving payload');
    this._receivePayload();

    this._endRequest(function () {
        $this.info('All data received');
        try {
            controllerInstance.payload = JSON.parse($this.payload);
        } catch (e) {
            controllerInstance.payload = querystring.parse($this.payload);
        }
        controllerInstance.segments = $this.segments;
        controllerInstance.query = $this.query;
        controllerInstance.prefixes = $this.prefixes;
        controllerInstance.readonly = {
            'request' : $this.request,
            'response' : $this.response
        };
        controllerInstance.requestHeaders = $this._headers();
        controllerInstance.responseHeaders = {
            'Server' : 'NRCM/' + $this.version
        };

        var timer;

        var afterCallback = function () {
            clearTimeout(timer);

            try {
                if (controllerInstance.statusCode === undefined) {
                    controllerInstance.statusCode = 200;
                }
                (function setHeaders() {
                    var name, value;
                    if (typeof controllerInstance.responseHeaders === 'object') {
                        for (name in controllerInstance.responseHeaders) {
                            if (controllerInstance.responseHeaders.hasOwnProperty(name)) {
                                value = controllerInstance.responseHeaders[name];
                                $this._setHeader(name, value);
                            }
                        }
                    }
                }());

                $this.info('Destroying components');
                (function destroyComponents() {
                    var componentInstance, componentName;
                    var componentsCreated = $this.componentFactory.getComponents();
                    for (componentName in componentsCreated) {
                        if (componentsCreated.hasOwnProperty(componentName)) {
                            componentInstance = componentsCreated[componentName];
                            if (typeof componentInstance.destroy === 'function') {
                                componentInstance.destroy();
                            }
                        }
                    }
                }());

                $this.render(
                    savedOutput,
                    controllerInstance.statusCode,
                    controllerInstance.contentType
                );
                if (typeof done === 'function') {
                    done();
                }
            } catch (e) {
                $this.handleRequestException(e);
            }
        };
        var controllerMethodCallback = function (output) {
            savedOutput = output;
            try {
                (function callAfterIfDefined() {
                    if (controllerInstance.after !== undefined) {
                        controllerInstance.after(afterCallback);
                    } else {
                        afterCallback();
                    }
                }());
            } catch (e) {
                clearTimeout(timer);
                $this.handleRequestException(e);
            }
        };
        var beforeCallback = function () {
            try {
                // Call the controller method (put, get, delete, post, etc)
                savedOutput = controllerInstance[httpMethod](controllerMethodCallback);
            } catch (e) {
                clearTimeout(timer);
                $this.handleRequestException(e);
            }
        };

        // Encapsulate the method in a immediate so it can be killed
        var controllerMethodImmediate = setImmediate(function () {
            try {
                (function callBefore() {
                    if (controllerInstance.before !== undefined) {
                        controllerInstance.before(beforeCallback);
                    } else {
                        beforeCallback();
                    }
                }());
            } catch (e) {
                // Catch exceptions that may occur in the controller before method
                clearTimeout(timer);
                $this.handleRequestException(e);
            }
        });

        $this.info('Timeout timer started');

        (function startTimeoutTimer() {
            timer = setTimeout(function () {
                clearImmediate(controllerMethodImmediate);
                $this.handleRequestException(new exceptions.Timeout());
            }, application.core.requestTimeout);
        }());
    });
};

RequestHandler.prototype.info = function (message) {
    this.serverLogger.info('[RequestHandler] ' + message);
};

/**
 * It handles the exceptions
 *
 * @method handleRequestException
 * @param {object} e The error
 */
RequestHandler.prototype.handleRequestException = function (e) {
    this.info('Handling exception');

    var knownException = e.name !== undefined;
    if (knownException) {
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
        this.info(chalk.red('Exception ' + e.name + ' handled'));
    } else {
        this.info(chalk.red('Unknown Exception: ' + e));
        if (e.stack !== undefined) {
            this.info(e.stack);
        }
    }
};
/**
 * The callback function that sends the response back to the client
 *
 * @method render
 * @param {object=} output The body/payload data
 * @param {number=} statusCode The status code for http response
 * @param {string|boolean=} contentType The text for the Content-Type http header
 */
RequestHandler.prototype.render = function (output, statusCode, contentType) {
    if (output !== '') {
        output = output || '{}';
    }
    if (contentType !== false) {
        contentType = contentType || 'application/json';
    }

    if (this.method === 'head') {
        output = '';
        contentType = false;
    }

    if (this.stringOutput === undefined) {
        this.info('Rendering');
        this.info('Content-Type: ' + contentType);
        this._writeHead(statusCode, contentType);
        if (typeof output === 'object') {
            this.stringOutput = JSON.stringify(output);
        } else {
            this.stringOutput = output;
        }
        this._writeResponse(this.stringOutput);
        this.info('Output: ' + chalk.yellow(this.stringOutput.length > 1000 ? this.stringOutput.substring(0, 1000) + '...' : this.stringOutput));
        this._sendResponse();
        this.end = new Date();
        this.info(chalk.cyan('Time: ' + (this.end.getTime() - this.start.getTime()) + 'ms'));
    }
    return this.stringOutput;
};

module.exports = RequestHandler;
