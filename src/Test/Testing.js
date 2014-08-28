/*jslint devel: true, node: true, indent: 4 */
'use strict';

var path = require('path');
var fs = require('fs');
var ComponentFactory = require('../Component/ComponentFactory');
var ModelFactory = require('../Model/ModelFactory');
var DataSource = require('../Model/DataSource');
var RequestHandler = require('../Controller/RequestHandler');

/**
 * Testing tool constructor
 * @constructor
 * @param {string} applicationPath
 * @param {json} core
 */
function Testing(applicationPath, core) {
    var dataSources, dataSourceName, dataSourceConfig;
    this.core = core || {};
    this.core.requestTimeout = this.core.requestTimeout || 1000;
    this.core.dataSources = this.core.dataSources || {};

    this.applicationPath = applicationPath;
    this.controllers = { };
    this.components = { };
    this.models = { };
    var logger = {
        'info' : function () { return; },
        'debug' : function () { return; }
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

    dataSources = [];

    this.applications = {
        'app' : this.application
    };

    // Instantiate all DataSources
    for (dataSourceName in this.core.dataSources) {
        if (this.core.dataSources.hasOwnProperty(dataSourceName)) {
            dataSourceConfig = this.core.dataSources[dataSourceName];
            dataSources[dataSourceName] = new DataSource(logger, dataSourceName, dataSourceConfig);
        }
    }

    // Necessary for testing Components and Models
    // When you are testing the Controllers, RequestHandler has its own ModelFactory and ComponentFactory
    this.componentFactory = new ComponentFactory(logger, this.application);
    this.modelFactory = new ModelFactory(logger, this.application, dataSources, this.componentFactory);
}

Testing.prototype._require = function (path) {
    return require(path);
};

Testing.prototype._exists = function (path) {
    return fs.existsSync(path);
};


Testing.prototype.createModel = function (modelName) {
    var $this = this;
    this.loadModel(modelName);
    var instance = this.modelFactory.create(modelName);
    instance.model = function (modelName) {
        return $this._model(modelName);
    };
    instance.component = function (componentName) {
        return $this._component(componentName);
    };
    return instance;
};

Testing.prototype.createComponent = function (componentName) {
    var $this = this;
    this.loadComponent(componentName);
    var instance = this.componentFactory.create(componentName);
    instance.component = function (componentName) {
        return $this._component(componentName);
    };
    return instance;
};

Testing.prototype.loadModel = function (modelName) {
    this.models[modelName] = this._require(path.join(this.applicationPath, 'src', 'Model', modelName));
};

/**
 *
 * @param componentName
 */
Testing.prototype.loadComponent = function (componentName) {
    var applicationComponentPath = path.join(this.applicationPath, 'src', 'Component', componentName);
    var builtinComponentPath = path.join('..', '..', 'src', 'Component', 'Builtin', componentName);

    if (this._exists(applicationComponentPath)) {
        this.components[componentName] = this._require(applicationComponentPath);
    } else if (this._exists(builtinComponentPath)) {
        this.components[componentName] = this._require(builtinComponentPath);
    } else {
        throw {
            'name' : 'ComponentNotFound',
            'component' : componentName
        };
    }
};

Testing.prototype.mockModel = function (modelName, methods) {
    this.loadModel(modelName);
    this.mockedMethods.models[modelName] = methods;
};

Testing.prototype.mockComponent = function (componentName, methods) {
    this.loadComponent(componentName);
    this.mockedMethods.components[componentName] = methods;
};

Testing.prototype._model = function (modelName) {
    var $this = this;
    var modelInstance = this.modelFactory.create(modelName);
    var methods = this.mockedMethods.models[modelName];
    var methodName;
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
    return modelInstance;
};

Testing.prototype._component = function (componentName) {
    var $this = this;
    var componentInstance = this.componentFactory.create(componentName);
    var methods = this.mockedMethods.components[componentName];
    var methodName;
    if (methods !== undefined) {
        for (methodName in methods) {
            if (methods.hasOwnProperty(methodName)) {
                componentInstance[methodName] = methods[methodName];
            }
        }
    }
    componentInstance.component = function (componentName) {
        return $this._component(componentName);
    };
    return componentInstance;
};

Testing.prototype.callController = function (controllerName, httpMethod, options, callback) {
    var $this = this;
    var controllerPath = path.join(this.applicationPath, 'src', 'Controller', controllerName);
    var responseStatusCode, responseContentType, responseHeaders = { }, instance;

    this.controllers[controllerName] = this._require(controllerPath);
    var requestHandler = new RequestHandler({
        'debug' : function () { return; },
        'info' : function () { return; }
    }, this.core, this.applications, null);
    // Inject the URL segments
    requestHandler.segments = options.segments;

    // Mock some RequestHandler methods
    requestHandler._endRequest = function (callback) {
        setImmediate(callback);
    };

    var blankFunction = function () {
        return;
    };

    // Return the request headers
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

    // Set the response headers
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
    // Override the Model and Component factories
    requestHandler.modelFactory = this.modelFactory;
    requestHandler.componentFactory = this.componentFactory;

    // Override the model and component method from the controller
    instance.model = function (modelName) {
        return $this._model(modelName);
    };
    instance.component = function (componentName) {
        return $this._component(componentName);
    };

    requestHandler.invokeController(instance, httpMethod, function () {
        callback(JSON.parse(requestHandler.stringOutput), {
            'statusCode' : responseStatusCode,
            'contentType' : responseContentType,
            'headers' : responseHeaders,
        });
    });
    this.options = options;
};

module.exports = Testing;