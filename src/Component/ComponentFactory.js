/*jslint devel: true, node: true, indent: 4 */
'use strict';
/**
 * Responsible for creating components
 * @param logger
 * @param application The application object
 * @constructor
 */
function ComponentFactory(logger, application, modelFactory) {
    this._application = application;
    this._logger = logger;
    this._dynamicComponents = [];
    this._staticComponents = {};
    this._modelFactory = modelFactory;
    this.info('ComponentFactory created');
}

ComponentFactory.prototype.info = function (msg) {
    this._logger.info('[ComponentFactory] ' + msg);
};

/**
 * Return all components instantiated by this factory (both dynamic and static)
 * @returns {{}|*}
 */
ComponentFactory.prototype.getComponents = function () {
    var componentName, instances = [];

    this._dynamicComponents.forEach(function (instance) {
        instances.push(instance);
    });

    for (componentName in this._staticComponents) {
        if (this._staticComponents.hasOwnProperty(componentName)) {
            instances.push(this._staticComponents[componentName]);
        }
    }

    return instances;
};

/**
 * Instantiate a component (builtin or application)
 * @param {string} componentName The name of the component to be instantiated. If there are folder, they must be separated by dot.
 * @param {object=} params Parameters passed to the component constructor
 * @returns {object} The component instantiated or null if it does not exist
 */
ComponentFactory.prototype.create = function (componentName, params) {
    this.info('[' + componentName + '] Creating component');
    var $this = this, alreadyInstantiated, ComponentConstructor, componentInstance;

    if (this._application.components[componentName] !== undefined) {
        ComponentConstructor = this._application.components[componentName];
        if (ComponentConstructor === null) {
            return null;
        }
        componentInstance = new ComponentConstructor(params);

        if (componentInstance.singleInstance === true) {
            alreadyInstantiated = this._staticComponents[componentName] !== undefined;
            if (alreadyInstantiated) {
                this.info('[' + componentName + '] Recycling component');
                return this._staticComponents[componentName];
            }
        }

        componentInstance.name = componentName;
        componentInstance.constants = this._application.constants;
        componentInstance.model = function (modelName) {
            var instance = $this._modelFactory.create(modelName);
            $this._modelFactory.init(instance);
            return instance;
        };
        componentInstance.component = function (componentName, params) {
            var instance = $this.create(componentName, params);
            $this.init(componentName);
            return instance;
        };
        componentInstance.core = this._application.core;
        componentInstance.configs = this._application.configs;
        this.info('[' + componentName + '] Component created');
        if (componentInstance.singleInstance) {
            this._staticComponents[componentName] = componentInstance;
        } else {
            this._dynamicComponents.push(componentInstance);
        }
        return componentInstance;
    }
    this.info('[' + componentName + '] Component not found');
    return null;
};

/**
 * Calls the component init() method if defined
 * @param {object} componentInstance The component instance
 */
ComponentFactory.prototype.init = function (componentInstance) {
    if (componentInstance !== null && typeof componentInstance.init === 'function') {
        this.info('[' + componentInstance.name + '] Component initialized');
        componentInstance.init();
    }
};

module.exports = ComponentFactory;