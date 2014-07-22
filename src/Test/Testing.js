/*jslint devel: true, node: true, indent: 4 */
'use strict';

var path = require('path');
var ComponentFactory = require('../Component/ComponentFactory');
var ModelFactory = require('../Model/ModelFactory');
var DataSource = require('../Model/DataSource');
var RequestHandler = require('../Controller/RequestHandler');

function Testing(applicationPath, dataSourceConfigs) {
    var application, dataSources, dataSourceName, dataSourceConfig;

    this.applicationPath = applicationPath;
    this.configs = {
        'requestTimeout' : 10000
    };
    this.controllers = { };
    this.components = { };
    this.models = { };

    application = {
        'controllers' : this.controllers,
        'components' : this.components,
        'models' : this.models
    };
    dataSources = [];

    this.applications = {
        'app' : application
    };

    // Instantiate all DataSources
    for (dataSourceName in dataSourceConfigs) {
        if (dataSourceConfigs.hasOwnProperty(dataSourceName)) {
            dataSourceConfig = dataSourceConfigs[dataSourceName];
            dataSources[dataSourceName] = new DataSource(dataSourceName, dataSourceConfig);
        }
    }

    this.componentFactory = new ComponentFactory(application);
    this.modelFactory = new ModelFactory(application, dataSources, this.componentFactory);
}

Testing.prototype._require = function (path) {
    return require(path);
};

Testing.prototype.loadModel = function (modelName) {
    this.models[modelName] = this._require(path.join(this.applicationPath, 'src', 'Model', modelName));
    return this.models[modelName];
};

Testing.prototype.loadComponent = function (componentName) {
    this.components[componentName] = this._require(path.join(this.applicationPath, 'src', 'Component', componentName));
    return this.components[componentName];
};

Testing.prototype.createModel = function (modelName) {
    this.loadModel(modelName);
    return this.modelFactory.create(modelName);
};

Testing.prototype.createComponent = function (componentName) {
    this.loadComponent(componentName);
    return this.componentFactory.create(componentName);
};

Testing.prototype.callController = function (controllerName, httpMethod, options, callback) {
    var controllerPath = path.join(this.applicationPath, 'src', 'Controller', controllerName);
    this.applications.app.controllers[controllerName] = this._require(controllerPath);

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
    requestHandler._setHeader = blankFunction;
    requestHandler._writeHead = blankFunction;
    requestHandler._writeResponse = blankFunction;
    requestHandler._sendResponse = blankFunction;
    requestHandler.info = blankFunction;
    requestHandler.debug = blankFunction;

    if (options.query !== undefined) {
        requestHandler.query = options.query;
    } else {
        requestHandler.query = { };
    }

    requestHandler.appName = 'app';
    var instance = requestHandler.prepareController(controllerName);
    requestHandler.invokeController(instance, httpMethod, function () {
        callback(JSON.parse(requestHandler.stringOutput));
    });
    this.options = options;
};

module.exports = Testing;