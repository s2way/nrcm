/*jslint devel: true, node: true, indent: 4 */
'use strict';

/**
 * Responsible for creating components and models
 * @param logger
 * @param application The application object
 * @constructor
 */
function ElementFactory(logger, application) {
    this._application = application;
    this._logger = logger;
    this._models = [];
    this._dynamicComponents = [];
    this._staticComponents = {};
    this.log('ElementFactory created');
}

ElementFactory.prototype.log = function (msg) {
    this._logger.log('[ElementFactory] ' + msg);
};

/**
 * Return all components instantiated by this factory (both dynamic and static)
 * @returns {{}|*}
 */
ElementFactory.prototype.getComponents = function () {
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
 * @param {string} type Element type: 'component' or 'model'
 * @param {string} componentName The name of the component to be instantiated. If there are folder, they must be separated by dot.
 * @param {object=} params Parameters passed to the component constructor
 * @returns {object} The component instantiated or null if it does not exist
 */
ElementFactory.prototype.create = function (type, elementName, params) {
    this.log('[' + elementName + '] Creating ' + type);
    var $this = this, alreadyInstantiated, ElementConstructor, elementInstance;

    if (type === 'model' && this._application.models[elementName] !== undefined) {
        ElementConstructor = this._application.models[elementName];
    } else if (type === 'component' && this._application.components[elementName] !== undefined) {
        ElementConstructor = this._application.components[elementName];
    } else {
        this.log('[' + elementName + '] Component not found');
        return null;
    }

    if (ElementConstructor === null) {
        return null;
    }

    elementInstance = new ElementConstructor(params);

    if (type === 'component') {
        if (elementInstance.singleInstance === true) {
            alreadyInstantiated = this._staticComponents[elementName] !== undefined;
            if (alreadyInstantiated) {
                this.log('[' + elementName + '] Recycling component');
                return this._staticComponents[elementName];
            }
        }
    }

    elementInstance.name = elementName;
    elementInstance.constants = this._application.constants;
    elementInstance.model = function (modelName) {
        var instance = $this.create('model', modelName);
        $this.init(instance);
        return instance;
    };
    elementInstance.component = function (componentName, params) {
        var instance = $this.create('component', componentName, params);
        $this.init(componentName);
        return instance;
    };
    elementInstance.core = this._application.core;
    elementInstance.configs = this._application.configs;
    this.log('[' + elementName + '] Element created');

    if (type === 'component') {
        if (elementInstance.singleInstance) {
            this._staticComponents[elementName] = elementInstance;
        } else {
            this._dynamicComponents.push(elementInstance);
        }
    } else {
        this._models.push(elementInstance);
    }
    return elementInstance;
};

/**
 * Calls the component init() method if defined
 * @param {object} componentInstance The component instance
 */
ElementFactory.prototype.init = function (elementInstance) {
    if (elementInstance !== null && typeof elementInstance.init === 'function') {
        this.log('[' + elementInstance.name + '] Element initialized');
        elementInstance.init();
    }
};

module.exports = ElementFactory;