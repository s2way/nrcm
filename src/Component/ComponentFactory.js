/*jslint devel: true, node: true, indent: 4 */
'use strict';

var logger = require('./../Util/logger');

function ComponentFactory(application) {
    this.application = application;
    this.info('ComponentFactory created');
}

ComponentFactory.prototype.info = function (msg) {
    logger.info('[ComponentFactory] ' + msg);
};

ComponentFactory.prototype.create = function (componentName) {
    this.info('Creating component: ' + componentName);
    var that = this;
    var ComponentConstructor, componentInstance;

    if (this.application.components[componentName] !== undefined) {
        ComponentConstructor = this.application.components[componentName];
        if (ComponentConstructor === null) {
            return null;
        }
        componentInstance = new ComponentConstructor();
        componentInstance.name = componentName;
        componentInstance.component = function (componentName) {
            return that.create(componentName);
        };
        this.info('Component created');
        return componentInstance;
    }
    this.info('Component not found');
    return null;
};

module.exports = ComponentFactory;