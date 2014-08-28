/*jslint devel: true, node: true, indent: 4 */
'use strict';
/**
 * Responsible for creating components
 * @param logger
 * @param application The application object
 * @constructor
 */
function ComponentFactory(logger, application) {
    this._application = application;
    this._logger = logger;
    this._components = {};
    this.info('ComponentFactory created');
}

ComponentFactory.prototype.info = function (msg) {
    this._logger.info('[ComponentFactory] ' + msg);
};

/**
 * Return all components instantiated by this factory
 * @returns {{}|*}
 */
ComponentFactory.prototype.getComponents = function () {
    return this._components;
};

/**
 * Instantiate a component (builtin or application)
 * @param {string} componentName The name of the component to be instantiated. If there are folder, they must be separated by dot.
 * @param {object=} params Parameters passed to the component constructor
 * @returns {object} The component instantiated or null if it does not exist
 */
ComponentFactory.prototype.create = function (componentName, params) {
    this.info('Creating component: ' + componentName);
    var $this = this;
    var ComponentConstructor, componentInstance;
    var componentAlreadyCreated = this._components[componentName] !== undefined;

    if (componentAlreadyCreated) {
        return this._components[componentName];
    }

    if (this._application.components[componentName] !== undefined) {
        ComponentConstructor = this._application.components[componentName];
        if (ComponentConstructor === null) {
            return null;
        }
        componentInstance = new ComponentConstructor(params);
        componentInstance.name = componentName;
        componentInstance.logger = this._application.logger;
        componentInstance.component = function (componentName) {
            return $this.create(componentName);
        };
        this.info('Component created');
        this._components[componentName] = componentInstance;
        return componentInstance;
    }
    this.info('Component not found');
    return null;
};

module.exports = ComponentFactory;