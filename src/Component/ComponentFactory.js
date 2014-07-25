/*jslint devel: true, node: true, indent: 4 */
'use strict';

function ComponentFactory(application) {
    this.application = application;
}

ComponentFactory.prototype.create = function (componentName) {
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
        return componentInstance;
    }
    return null;
};

module.exports = ComponentFactory;