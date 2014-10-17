/*jslint devel: true, node: true, indent: 4, vars: true, maxlen: 256 */
'use strict';
var querystring = require('querystring');
var exceptions = require('./../exceptions');
var Router = require('./../Core/Router');
var ElementFactory = require('./../Core/ElementFactory');
var chalk = require('chalk');
var XML = require('../Component/Builtin/XML');

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
    this.log('RequestHandler created');
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
    this.log(chalk.bold.green('Request: ' + requestUrl));

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

        this.log('Application: ' + this.appName);
        this.log('Method: ' + this.method);
        this.log('URL type: ' + type);
        this.log('Prefixes: ' + JSON.stringify(this.prefixes));
        this.log('Query: ' + JSON.stringify(this.query));

        if (type === 'controller') {
            var controllerInfo = router.findController(this.application.controllers, decomposedURL);
            var controllerNameCamelCase = controllerInfo.controller;
            this.segments = controllerInfo.segments;

            this.log('Segments: ' + JSON.stringify(this.segments));
            this.log('Controller: ' + controllerNameCamelCase);

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

    this.elementFactory = new ElementFactory(this.serverLogger, application);

    this.log('Creating controller');

    var ControllerConstructor = application.controllers[controllerName];
    var controllerInstance = new ControllerConstructor();

    (function injectProperties() {
        var retrieveComponentMethod = function (componentName, params) {
            var instance = $this.elementFactory.create('component', componentName, params);
            $this.elementFactory.init(instance);
            return instance;
        };
        var retrieveModelMethod = function (modelName, params) {
            var instance = $this.elementFactory.create('model', modelName, params);
            $this.elementFactory.init(instance);
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
        controllerInstance.core = application.core;
        controllerInstance.configs = application.configs;
        controllerInstance.component = retrieveComponentMethod;
        controllerInstance.model = retrieveModelMethod;
        controllerInstance.trace = automaticTraceImplementation;
        controllerInstance.options = automaticOptionsImplementation;
        controllerInstance.method = $this.method;
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
        headers['content-type'] = contentType;
    }
    this.response.writeHead(statusCode, headers);
};

RequestHandler.prototype._writeResponse = function (output) {
    this.response.write(output);
};

RequestHandler.prototype._sendResponse = function () {
    this.response.end();
};

RequestHandler.prototype._parsePayload = function (contentType, payload) {
    var isJSON, isXML, isUrlEncoded;

    isJSON = contentType.indexOf('application/json') !== -1;
    isXML = contentType.indexOf('text/xml') !== -1;
    isUrlEncoded = contentType.indexOf('application/x-www-form-urlencoded') !== -1;

    try {
        if (payload !== '') {
            if (isJSON) {
                return JSON.parse(payload);
            }
            if (isXML) {
                return new XML().toJSON(payload);
            }
            if (isUrlEncoded) {
                return querystring.parse(payload);
            }
            return payload;
        }
    } catch (e) {
        this.log('Error while parsing payload: ' + e);
    }
    return null;
};

/**
 * It executes a function within the controller
 *
 * @method invokeController
 * @param {string} controller The controller's name
 * @param {string} method The controller`s method that should be invoked
 */
RequestHandler.prototype.invokeController = function (controllerInstance, httpMethod, done) {
    var $this, savedOutput, application;
    $this = this;

    $this.log('Invoking controller');

    savedOutput = null;
    application = this.applications[this.appName];

    if (controllerInstance[httpMethod] === undefined) {
        throw new exceptions.MethodNotFound();
    }

    $this.log('Receiving payload');
    this._receivePayload();

    this._endRequest(function () {
        var requestHeaders, requestContentType;

        $this.log('All data received');
        requestHeaders = $this._headers();
        requestContentType = requestHeaders['content-type'] || 'application/json';

        controllerInstance.payload = $this._parsePayload(requestContentType, $this.payload);
        controllerInstance.segments = $this.segments;
        controllerInstance.query = $this.query;
        controllerInstance.prefixes = $this.prefixes;
        controllerInstance.requestHeaders = requestHeaders;
        controllerInstance.responseHeaders = {
            'Server' : 'WaferPie/' + $this.version
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

                $this.log('Destroying components');
                (function destroyComponents() {
                    var componentInstance, componentName;
                    var componentsCreated = $this.elementFactory.getComponents();
                    var destroyComponentInstance = function () {
                        $this.log('Destroying ' + componentName);
                        componentInstance.destroy();
                    };
                    for (componentName in componentsCreated) {
                        if (componentsCreated.hasOwnProperty(componentName)) {
                            componentInstance = componentsCreated[componentName];
                            if (typeof componentInstance.destroy === 'function') {
                                setImmediate(destroyComponentInstance);
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

        $this.log('Timeout timer started');

        (function startTimeoutTimer() {
            timer = setTimeout(function () {
                clearImmediate(controllerMethodImmediate);
                $this.handleRequestException(new exceptions.Timeout());
            }, application.core.requestTimeout);
        }());
    });
};

RequestHandler.prototype.log = function (message) {
    this.serverLogger.log('[RequestHandler] ' + message);
};

RequestHandler.prototype.error = function (message) {
    this.serverLogger.error('[RequestHandler] ' + message);
};


/**
 * It handles the exceptions
 *
 * @method handleRequestException
 * @param {object} e The error
 */
RequestHandler.prototype.handleRequestException = function (e) {
    this.log('Handling exception');

    var knownException = e.name !== undefined;
    if (knownException) {
        var $this = this;
        var method = 'on' + e.name;
        this.log('Creating ExceptionsController instance');
        var instance = new this.ExceptionsController();
        instance.statusCode = 200;
        var callback = function (output) {
            if (instance.statusCode === undefined) {
                instance.statusCode = 200;
            }
            $this.log('Rendering exception');
            return $this.render(output, instance.statusCode);
        };
        if (typeof instance[method] === 'function') {
            instance[method](callback);
        } else if (instance.onGeneral !== undefined) {
            instance.onGeneral(callback, e);
        } else {
            this.log(e);
            if (e.stack !== undefined) {
                this.log(e.stack);
            }
            return;
        }
        this.error('Exception ' + e.name + ' handled');
    } else {
        this.error('Unknown Exception: ' + e);
        if (e.stack !== undefined) {
            this.error(e.stack);
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
    var isJSON, isXML;

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
        this.log('Rendering');
        this.log('content-type: ' + contentType);
        this._writeHead(statusCode, contentType);
        if (typeof output === 'object') {
            isJSON = contentType.indexOf('application/json') !== -1;
            isXML = contentType.indexOf('text/xml') !== -1;

            if (isJSON) {
                this.stringOutput = JSON.stringify(output);
            } else if (isXML) {
                this.stringOutput = new XML().fromJSON(output);
            } else {
                this.stringOutput = output;
            }

        } else {
            this.stringOutput = output;
        }
        this._writeResponse(this.stringOutput);
        this.log('Output: ' + chalk.cyan(this.stringOutput.length > 1000 ? this.stringOutput.substring(0, 1000) + '...' : this.stringOutput));

        if (statusCode >= 200 && statusCode < 300) {
            this.log(chalk.green('Response Status: ' + statusCode));
        } else if (statusCode >= 400 && statusCode < 500) {
            this.log(chalk.yellow('Response Status: ' + statusCode));
        } else if (statusCode >= 500) {
            this.log(chalk.red('Response Status: ' + statusCode));
        } else {
            this.log(chalk.blue('Response Status: ' + statusCode));
        }

        this._sendResponse();
        this.end = new Date();
        this.log(chalk.cyan('Time: ' + (this.end.getTime() - this.start.getTime()) + 'ms'));
    }
    return this.stringOutput;
};

module.exports = RequestHandler;
