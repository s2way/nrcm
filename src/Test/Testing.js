/*jslint devel: true, node: true, indent: 4, stupid: true */
/*globals __dirname */
'use strict';

var path = require('path');
var fs = require('fs');
var ComponentFactory = require('../Component/ComponentFactory');
var ModelFactory = require('../Model/ModelFactory');
var RequestHandler = require('../Controller/RequestHandler');

/**
 * Testing tool constructor
 * @constructor
 * @param {string} applicationPath The path of your application
 * @param {json} core Mocked core.json object
 */
function Testing(applicationPath, core) {
    this.core = core || {};
    this.core.requestTimeout = this.core.requestTimeout || 1000;
    this.core.dataSources = this.core.dataSources || {};

    this.applicationPath = applicationPath;
    this.controllers = { };
    this.components = { };
    this.models = { };
    var logger = {
        'info' : function () { return; },
        'debug' : function () { return; },
        'error' : function () { return; },
        'warn' : function () { return; }
    };
    this.application = {
        'controllers' : this.controllers,
        'components' : this.components,
        'models' : this.models,
        'core' : this.core,
        'logger' : logger
    };
    this.mockedMethods = {
        'components' : { },
        'models' : { }
    };

    this.applications = {
        'app' : this.application
    };

    // Necessary for testing Components and Models
    // When you are testing the Controllers, RequestHandler has its own ModelFactory and ComponentFactory
    this.componentFactory = new ComponentFactory(logger, this.application);
    this.modelFactory = new ModelFactory(logger, this.application, this.componentFactory);
}

Testing.prototype.mockConfigs = function (configs) {
    this.applications.app.configs = configs;
};

/**
 * Call require
 * Necessary for mocking in the tests
 * @param path
 * @returns {Object|*}
 * @private
 */
Testing.prototype._require = function (path) {
    return require(path);
};

/**
 * Call fs.existsSync
 * Necessary for mocking in the tests
 * @param path
 * @returns {*}
 * @private
 */
Testing.prototype._exists = function (path) {
    return fs.existsSync(path);
};

/**
 * Loads, creates and returns the model instance or null if not found
 * @param {string} modelName The model name
 * @returns {object} The model instance or null
 */
Testing.prototype.createModel = function (modelName) {
    var $this, instance;
    $this = this;
    this.loadModel(modelName);
    instance = this.modelFactory.create(modelName);
    instance.model = function (modelName) {
        return $this._model(modelName);
    };
    instance.component = function (componentName, params) {
        return $this._component(componentName, params);
    };
    return instance;
};

/**
 * Loads, creates, and returns the component instance or null if not found
 * @param {string} componentName The name of the component
 * @returns {object} The component instance or null
 */
Testing.prototype.createComponent = function (componentName) {
    var $this, instance;
    $this = this;
    this.loadComponent(componentName);
    instance = this.componentFactory.create(componentName);
    instance.component = function (componentName, params) {
        return $this._component(componentName, params);
    };
    return instance;
};

Testing.prototype.loadModel = function (modelName) {
    var modelsPath = path.join(this.applicationPath, 'src', 'Model', modelName);
    if (this._exists(modelsPath + '.js')) {
        this.models[modelName] = this._require(modelsPath);
        return;
    }
    throw {
        'name' : 'ModelNotFound',
        'model' : modelName
    };
};

/**
 * Loads a component
 * You have to load all dependent components that you do not want to mock in your tests, including built-ins (QueryBuilder, etc)
 * @param {string} componentName The name of the component
 */
Testing.prototype.loadComponent = function (componentName) {
    var componentNameAsPath, applicationComponentPath, builtinComponentPath;

    componentNameAsPath = componentName.replace(/\./g, path.sep);
    applicationComponentPath = path.join(this.applicationPath, 'src', 'Component', componentNameAsPath);
    builtinComponentPath = path.join(__dirname, '..', 'Component', 'Builtin', componentNameAsPath);

    if (this._exists(applicationComponentPath + '.js')) {
        this.components[componentName] = this._require(applicationComponentPath);
    } else if (this._exists(builtinComponentPath + '.js')) {
        this.components[componentName] = this._require(builtinComponentPath);
    } else {
        throw {
            'name' : 'ComponentNotFound',
            'component' : componentName
        };
    }
};

/**
 * Loads a model an then mocks its methods
 * @param {string} modelName The name of the model
 * @param {object} methods A JSON containing methods that will be injected into the model instance
 */
Testing.prototype.mockModel = function (modelName, methods) {
    this.loadModel(modelName);
    this.mockedMethods.models[modelName] = methods;
};

/**
 * Loads a component an then mocks its components
 * @param {string} componentName The name of the component
 * @param {object} methods A JSON containing methods taht will be injected into the component instance
 */
Testing.prototype.mockComponent = function (componentName, methods) {
    this.loadComponent(componentName);
    this.mockedMethods.components[componentName] = methods;
};

Testing.prototype._model = function (modelName) {
    var $this, modelInstance, methods, methodName;
    $this = this;
    modelInstance = this.modelFactory.create(modelName);
    methods = this.mockedMethods.models[modelName];

    if (methods !== undefined) {
        for (methodName in methods) {
            if (methods.hasOwnProperty(methodName)) {
                modelInstance[methodName] = methods[methodName];
            }
        }
    }
    modelInstance.model = function (modelName) {
        return $this._model(modelName);
    };
    this.modelFactory.init(modelInstance);
    return modelInstance;
};

Testing.prototype._component = function (componentName, params) {
    var $this, componentInstance, methods, methodName;
    $this = this;
    componentInstance = this.componentFactory.create(componentName, params);
    methods = this.mockedMethods.components[componentName];

    if (methods !== undefined) {
        for (methodName in methods) {
            if (methods.hasOwnProperty(methodName)) {
                componentInstance[methodName] = methods[methodName];
            }
        }
    }
    componentInstance.component = function (componentName, params) {
        return $this._component(componentName, params);
    };
    this.componentFactory.init(componentInstance);
    return componentInstance;
};

/**
 * Call a controller method for testing
 * @param {string} controllerName The name of the controller to be called
 * @param {string} httpMethod HTTP method
 * @param {object} options Some options, including payload, query, and segments
 * @param {function} callback Function that will be called when the call is complete.
 * An object containing statusCode, headers, and contentType is passed to the callback.
 */
Testing.prototype.callController = function (controllerName, httpMethod, options, callback) {
    var $this, controllerPath, responseStatusCode, responseContentType, responseHeaders, instance, blankFunction, requestHandler;
    $this = this;
    controllerPath = path.join(this.applicationPath, 'src', 'Controller', controllerName);
    responseHeaders = { };
    blankFunction = function () {
        return;
    };

    this.controllers[controllerName] = this._require(controllerPath);
    requestHandler = new RequestHandler({
        'debug' : blankFunction,
        'info' : blankFunction,
        'error' : blankFunction,
        'warn' : blankFunction
    }, this.core, this.applications, null);

    requestHandler.segments = options.segments;
    requestHandler._endRequest = function (callback) {
        setImmediate(callback);
    };


    requestHandler._headers = function () {
        return [];
    };

    requestHandler._receivePayload = function () {
        if (options.payload === undefined) {
            this.payload = '';
        } else if (typeof options.payload === 'object') {
            this.payload = options.payload === null ? '' : JSON.stringify(options.payload);
        } else {
            this.payload = options.payload.toString();
        }
    };

    requestHandler.handleRequestException = function (e) {
        console.log(e);
        throw e;
    };

    requestHandler._writeResponse = blankFunction;
    requestHandler._sendResponse = blankFunction;
    requestHandler.info = blankFunction;
    requestHandler.debug = blankFunction;

    requestHandler._writeHead = function (statusCode, contentType) {
        responseStatusCode = statusCode;
        responseContentType = contentType;
    };

    requestHandler._setHeader = function (name, value) {
        responseHeaders[name] = value;
    };

    if (options.query !== undefined) {
        requestHandler.query = options.query;
    } else {
        requestHandler.query = { };
    }

    requestHandler.appName = 'app';
    instance = requestHandler.prepareController(controllerName);
    requestHandler.modelFactory = this.modelFactory;
    requestHandler.componentFactory = this.componentFactory;

    instance.model = function (modelName) {
        return $this._model(modelName);
    };
    instance.component = function (componentName, params) {
        return $this._component(componentName, params);
    };

    requestHandler.invokeController(instance, httpMethod, function () {
        callback(JSON.parse(requestHandler.stringOutput), {
            'statusCode' : responseStatusCode,
            'contentType' : responseContentType,
            'headers' : responseHeaders
        });
    });
    this.options = options;
};

module.exports = Testing;