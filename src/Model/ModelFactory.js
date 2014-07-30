/*jslint devel: true, node: true, indent: 4 */
'use strict';

var ModelInterface = require('./ModelInterface');
var logger = require('./../Util/logger');

function ModelFactory(application, dataSources, componentFactory) {
    this.application = application;
    this.dataSources = dataSources;
    this.componentFactory = componentFactory;
    this.info('ModelFactory created');
}

ModelFactory.prototype.info = function (msg) {
    logger.info('[ModelFactory] ' + msg);
};

ModelFactory.prototype.create = function (modelName) {
    this.info('Creating model: ' + modelName);
    var $this = this;
    var modelInterface, i, modelInterfaceMethod;

    function modelInterfaceDelegation(method) {
        return function () {
            return modelInterface[method].apply(modelInterface, arguments);
        };
    }

    if (this.application.models[modelName] !== undefined) {
        var ModelConstructor = this.application.models[modelName];
        var modelInstance = new ModelConstructor();
        var modelDataSourceName = modelInstance.dataSource;

        if (modelDataSourceName === undefined) {
            modelDataSourceName = 'default';
        }

        var dataSource = this.dataSources[modelDataSourceName];
        modelInstance.name = modelName;
        this.info('Creating ModelInterface');
        modelInterface = new ModelInterface(dataSource, {
            'uid' : modelInstance.uid,
            'keys' : modelInstance.keys,
            'locks' : modelInstance.locks,
            'requires' : modelInstance.requires,
            'validate' : modelInstance.validate,
            'schema' : modelInstance.schema
        });

        for (i in modelInterface.methods) {
            if (modelInterface.methods.hasOwnProperty(i)) {
                modelInterfaceMethod = modelInterface.methods[i];
                modelInstance['_' + modelInterfaceMethod] = modelInterfaceDelegation(modelInterfaceMethod);
            }
        }

        modelInstance.model = function (modelName) {
            return $this.create(modelName);
        };

        modelInstance.component = function (componentName) {
            return $this.componentFactory.create(componentName);
        };
        this.info('All model methods injected');

        return modelInstance;
    }
    this.info('Model not found');

    return null;
};

module.exports = ModelFactory;