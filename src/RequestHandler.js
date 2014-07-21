/*jslint devel: true, node: true, indent: 4, vars: true, maxlen: 256 */
'use strict';
// Dependencies
var querystring = require('querystring');
var util = require('util');
var aclModule = require('./acl');
var exceptions = require('./exceptions');
var stringUtils = require('./stringUtils');
var Router = require('./Router');
var ModelInterface = require('./Model/ModelInterface');
var DataSource = require('./Model/DataSource');

/**
 * The request handler object
 *
 * @constructor
 * @method RequestHandler
 * @param {json} configs
 * @param {json} applications
 * @param {object} ExceptionsController
 */
function RequestHandler(configs, applications, ExceptionsController) {
    this.applications = applications;
    this.configs = configs;
    this.isAllowed = aclModule.isAllowed;
    this.ExceptionsController = ExceptionsController;
}

/**
 * It processes every request received
 *
 * @method process
 * @param {object} request The nodejs request object
 * @param {object} response The nodejs response object
 */
RequestHandler.prototype.process = function (request, response) {
    this.debug('process()');

    this.request = request;
    this.response = response;
    this.extension = '.json';
    this.rule = null;
    this.payload = '';

    var requestUrl = this.request.url;
    this.info('---------------------------------');
    this.info('Request: ' + requestUrl);
    this.info('---------------------------------');

    try {
        var router = new Router(this.configs.urlFormat);

        // Verifica se a URL é válida
        if (!router.isValid(requestUrl)) {
            throw new exceptions.InvalidUrl();
        }

        // Utiliza o Router para decompor a URL
        var decomposedURL = router.decompose(requestUrl);
        var method = this.request.method.toLowerCase();

        this.appName = decomposedURL.application;

        // Verifica se a aplicação existe
        if (this.applications[this.appName] === undefined) {
            throw new exceptions.ApplicationNotFound(this.appName);
        }

        this.acl = this.applications[this.appName].acl;
        this.query = decomposedURL.query;
        this.prefixes = decomposedURL.prefixes;
        var controller = decomposedURL.controller;

        this.info('application=' + this.appName);
        this.info('controller=' + controller);
        this.info('method=' + method);
        this.info('prefixes=' + JSON.stringify(this.prefixes));
        this.info('query=' + JSON.stringify(this.query));

        var rule = this.isAllowed(this.acl, 'admin', controller, method);
        this.rule = rule;

        if (rule === false) {
            throw new exceptions.Forbidden();
        }

        var controllerNameCamelCase = stringUtils.lowerCaseUnderscoredToCamelCase(decomposedURL.controller);

        var controllerInstance = this.prepareController(controllerNameCamelCase);
        this.invokeController(controllerInstance, method);

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

    var dataSourceName, dataSourceConfig, modelInstance, componentInstance, ModelConstructor, dataSource, modelDataSourceName;
    var dataSources = [];

    // Instantiate all DataSources
    for (dataSourceName in this.configs.dataSources) {
        if (this.configs.dataSources.hasOwnProperty(dataSourceName)) {
            dataSourceConfig = this.configs.dataSources[dataSourceName];
            dataSources[dataSourceName] = new DataSource(dataSourceName, dataSourceConfig);
        }
    }
    that.dataSources = dataSources;

    var application = that.applications[that.appName];
    if (application.controllers[controllerName] === undefined) {
        that.debug('controller not found');
        throw new exceptions.ControllerNotFound();
    }

    var ControllerConstructor = application.controllers[controllerName];
    // Instantiate the controller
    var controllerInstance = new ControllerConstructor();

    controllerInstance.name = controllerName;
    controllerInstance.application = that.appName;

    var retrieveComponent = function (componentName) {
        var ComponentConstructor;
        if (application.components[componentName] !== undefined) {
            ComponentConstructor = application.components[componentName];
            componentInstance = new ComponentConstructor();
            componentInstance.name = componentName;
            componentInstance.component = retrieveComponent;
            return componentInstance;
        }
        return null;
    };

    // Injects the method for retrieving components in the controller and inside each component
    controllerInstance.component = retrieveComponent;

    var retrieveModel = function (modelName) {
        var modelInterface, i, modelInterfaceMethod;

        function modelInterfaceDelegation(method) {
            return function () {
                return modelInterface[method].apply(modelInterface, arguments);
            };
        }

        if (application.models[modelName] !== undefined) {
            ModelConstructor = application.models[modelName];
            modelInstance = new ModelConstructor();
            modelDataSourceName = modelInstance.dataSource;
            if (modelDataSourceName === undefined) {
                modelDataSourceName = 'default';
            }
            dataSource = dataSources[modelDataSourceName];
            modelInstance.name = modelName;
            modelInterface = new ModelInterface(dataSource, {
                'uid' : modelInstance.uid,
                'keys' : modelInstance.keys,
                'locks' : modelInstance.locks,
                'requires' : modelInstance.requires,
                'validate' : modelInstance.validate,
                'schema' : modelInstance.schema
            });

            for (i in modelInterface.methods) {
                if (modelInterface.methods.hasOwnProperty(i)) {
                    modelInterfaceMethod = modelInterface.methods[i];
                    modelInstance['_' + modelInterfaceMethod] = modelInterfaceDelegation(modelInterfaceMethod);
                }
            }
            modelInstance.model = retrieveModel;
            modelInstance.component = retrieveComponent;
            return modelInstance;
        }
        return null;
    };

    // Injects the method for retrieving models
    controllerInstance.model = retrieveModel;
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
    that.debug('invokeController()');

    var savedOutput = null;

    if (controllerInstance[httpMethod] === undefined) {
        that.debug('http method not found');
        throw new exceptions.MethodNotFound();
    }

    // Receiving data
    this._receivePayload();

    // All data received
    this._endRequest(function () {
        that.debug('request.end()');
        try {
            controllerInstance.payload = JSON.parse(that.payload);
        } catch (e) {
            controllerInstance.payload = querystring.parse(that.payload);
        }
        controllerInstance.query = that.query;
        controllerInstance.prefixes = that.prefixes;
        controllerInstance.readonly = {
            'request' : that.request,
            'response' : that.response
        };
        controllerInstance.requestHeaders = that._headers();
        controllerInstance.responseHeaders = {};

        var timer;

        var afterCallback = function () {
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

        // Timer that checks if the 
        timer = setTimeout(function () {
            that.debug('Request timeout!');
            clearImmediate(controllerMethodImmediate);
            that.handleRequestException(new exceptions.Timeout());
        }, that.configs.requestTimeout);
    });
};

RequestHandler.prototype.info = function (message) {
    console.log('[RequestHandler] ' + message);
};

RequestHandler.prototype.debug = function (message) {
    console.log('[RequestHandler] ' + message);
};
/**
 * It handles the exceptions
 *
 * @method handleRequestException
 * @param {object} e The error
 * @return {mixed} Returns false if it is an undefined exception or it will render the exception
 */
RequestHandler.prototype.handleRequestException = function (e) {
    this.debug('handleRequestException()');
    // Known exceptions
    if (e.name !== undefined) {
        var output = {};
        var method = 'on' + e.name;
        var instance = new this.ExceptionsController();
        var that = this;
        instance.statusCode = 200;
        var callback = function () {
            if (instance.statusCode === undefined) {
                instance.statusCode = 200;
            }
            return that.render(output, instance.statusCode);
        };
        if (typeof instance[method] === 'function') {
            output = instance[method](callback);
        } else if (instance.onGeneral !== undefined) {
            output = instance.onGeneral(callback, e);
        } else {
            output = JSON.stringify(e);
            callback();
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
 * @param {json} output The body/payload data
 * @param {number} statusCode The status code for http response
 * @param {string} contentType The text for the Content-Type http header
 */
RequestHandler.prototype.render = function (output, statusCode, contentType) {
    if (this.stringOutput === undefined) {
        this.debug('render()');
        var extensionsMapToContentType = {
            '.htm' : 'text/html',
            '.html' : 'text/html',
            '.json' : 'application/json',
            '.js' : 'application/json',
            '.xml' : 'text/xml'
        };
        // If the content type has not been specified, use the extension
        if (contentType === undefined) {
            contentType = extensionsMapToContentType[this.extension];
        }
        this._writeHead(statusCode, { 'Content-Type' : contentType });
        if (typeof output === 'object') {
            this.stringOutput = JSON.stringify(output);
        } else {
            this.stringOutput = output;
        }
        this._writeResponse(this.stringOutput);
        this.info('output=' + JSON.stringify(output));
        this._sendResponse();
    }
    return this.stringOutput;
};

module.exports = RequestHandler;
