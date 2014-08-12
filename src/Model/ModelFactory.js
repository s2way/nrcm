/*jslint devel: true, node: true, indent: 4 */
'use strict';

var ModelInterface = require('./ModelInterface');
var exceptions = require('./../exceptions');

function ModelFactory(logger, application, dataSources, componentFactory) {
    this.application = application;
    this.dataSources = dataSources;
    this.componentFactory = componentFactory;
    this.logger = logger;
    this.info('ModelFactory created');
}

ModelFactory.prototype.info = function (msg) {
    this.logger.info('[ModelFactory] ' + msg);
};

ModelFactory.prototype.create = function (modelName) {
    this.info('Creating model: ' + modelName);
    var $this = this;
    var modelInterface, i, modelInterfaceMethod;

    function modelInterfaceDelegation(method) {
        return function () {
            return modelInterface._model[method].apply(modelInterface._model, arguments);
        };
    }

    function notMocked() {
        throw new exceptions.NotMocked('You must mock this method in your tests');
    }

    if (this.application.models[modelName] !== undefined) {
        var ModelConstructor = this.application.models[modelName];
        var modelInstance = new ModelConstructor();
        var modelDataSourceName = modelInstance.dataSource;

        if (modelDataSourceName === undefined) {
            modelDataSourceName = 'default';
        }

        modelInstance.name = modelName;
        // Make the application logger available to the models
        modelInstance.logger = this.application.logger;

        this.info('Creating ModelInterface');
        var dataSource = this.dataSources[modelDataSourceName];
        // If the DataSource is not specified or not found, do not inject any interface methods
        if (!dataSource) {
            this.info('DataSource not found: ' + modelDataSourceName);
        } else {
            modelInterface = new ModelInterface(dataSource, modelInstance);

            for (i in modelInterface.methods) {
                if (modelInterface.methods.hasOwnProperty(i)) {
                    modelInterfaceMethod = modelInterface.methods[i];
                    modelInstance['$' + modelInterfaceMethod] = modelInterfaceDelegation(modelInterfaceMethod);
                }
            }

            // Overwrite methods that should be mocked if the mock property is set to true
            if (dataSource.mock) {
                for (i in modelInterface.mockMethods) {
                    if (modelInterface.mockMethods.hasOwnProperty(i)) {
                        modelInterfaceMethod = modelInterface.mockMethods[i];
                        modelInstance['$' + modelInterfaceMethod] = notMocked;
                    }
                }
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