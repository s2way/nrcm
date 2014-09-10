/*jslint devel: true, node: true, indent: 4 */
'use strict';

var exceptions = require('./../exceptions');

/**
 * Responsible for creating models
 * @param {object} logger
 * @param {object} application
 * @param {object} componentFactory
 * @constructor
 */
function ModelFactory(logger, application, componentFactory) {
    this._application = application;
    this._componentFactory = componentFactory;
    this._logger = logger;
    this._models = [];
    this.info('ModelFactory created');
}

ModelFactory.prototype.info = function (msg) {
    this._logger.info('[ModelFactory] ' + msg);
};

/**
 * Create a model. If it has already been called within the same request, returns the same instance again.
 * @param {string} modelName Model name (if folders are necessary, the names must be separated by dots)
 * @returns {object} The model instance or null if it does not exist
 */
ModelFactory.prototype.create = function (modelName) {
    this.info('Creating model: ' + modelName);
    var $this = this, ModelConstructor, modelInstance;

    if (this._application.models[modelName] !== undefined) {
        ModelConstructor = this._application.models[modelName];
        modelInstance = new ModelConstructor();
        modelInstance.name = modelName;
        modelInstance.constants = this._application.constants;
        modelInstance.logger = this._application.logger;
        modelInstance.model = function (modelName) {
            var instance = $this.create(modelName);
            $this.init(instance);
            return instance;
        };

        modelInstance.component = function (componentName, params) {
            var instance = $this._componentFactory.create(componentName, params);
            $this._componentFactory.init(instance);
            return instance;
        };
        this._models.push(modelInstance);
        this.info('All model methods injected');
        return modelInstance;
    }
    this.info('Model not found');

    return null;
};

/**
 * Initializes the model by calling its init() method if defined
 * @param {object} modelInstance The model instance
 */
ModelFactory.prototype.init = function (modelInstance) {
    if (modelInstance !== null && typeof modelInstance.init === 'function') {
        this.info('Model initialized');
        modelInstance.init();
    }
};

module.exports = ModelFactory;