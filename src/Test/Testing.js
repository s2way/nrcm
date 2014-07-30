/*jslint devel: true, node: true, indent: 4 */
'use strict';

var path = require('path');
var ComponentFactory = require('../Component/ComponentFactory');
var ModelFactory = require('../Model/ModelFactory');
var DataSource = require('../Model/DataSource');
var RequestHandler = require('../Controller/RequestHandler');

function Testing(applicationPath, dataSourceConfigs) {
    var dataSources, dataSourceName, dataSourceConfig;

    this.applicationPath = applicationPath;
    this.configs = {
        'requestTimeout' : 10000
    };
    this.controllers = { };
    this.components = { };
    this.models = { };

    this.application = {
        'controllers' : this.controllers,
        'components' : this.components,
        'models' : this.models,
        'core' : {
            'dataSources' : dataSourceConfigs
        }
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
    for (dataSourceName in dataSourceConfigs) {
        if (dataSourceConfigs.hasOwnProperty(dataSourceName)) {
            dataSourceConfig = dataSourceConfigs[dataSourceName];
            dataSources[dataSourceName] = new DataSource(dataSourceName, dataSourceConfig);
        }
    }

    // Necessary for testing Components and Models
    // When you are testing the Controllers, RequestHandler has its own ModelFactory and ComponentFactory
    this.componentFactory = new ComponentFactory(this.application);
    this.modelFactory = new ModelFactory(this.application, dataSources, this.componentFactory);
}

Testing.prototype._require = function (path) {
    return require(path);
};


Testing.prototype.createModel = function (modelName) {
    this.loadModel(modelName);
    var instance = this.modelFactory.create(modelName);
    instance.model = function () {
        this._model();
    };
    instance.component = this._component;
    return instance;
};

Testing.prototype.createComponent = function (componentName) {
    this.loadComponent(componentName);
    var instance = this.componentFactory.create(componentName);
    instance.component = this._component;
    return instance;
};

Testing.prototype.loadModel = function (modelName) {
    this.models[modelName] = this._require(path.join(this.applicationPath, 'src', 'Model', modelName));
};

Testing.prototype.loadComponent = function (componentName) {
    this.components[componentName] = this._require(path.join(this.applicationPath, 'src', 'Component', componentName));
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
    modelInstance.model = this._model;
    return modelInstance;
};

Testing.prototype._component = function (componentName) {
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
    componentInstance.component = this._component;
    return componentInstance;
};

Testing.prototype.callController = function (controllerName, httpMethod, options, callback) {
    var $this = this;
    var controllerPath = path.join(this.applicationPath, 'src', 'Controller', controllerName);
    var responseStatusCode, responseContentType, responseHeaders = { }, instance;

    this.controllers[controllerName] = this._require(controllerPath);
    var requestHandler = new RequestHandler(this.configs, this.applications, null);

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