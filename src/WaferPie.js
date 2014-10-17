/**
    Copyright 2014 Versul Tecnologias

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/
/*jslint devel: true, node: true, indent: 4, vars: true, maxlen: 256 */
/*globals __dirname*/
'use strict';
var path = require('path');
var http = require('http');
var exceptions = require('./exceptions');
var Sync = require('./Util/Sync');
var Logger = require('./Component/Builtin/Logger');
var RequestHandler = require('./Controller/RequestHandler');
var os = require('os');

function WaferPie() {
    this._version = require('./../package.json').version;
    this._applications = {};
    this._configured = false;
    this._configs = {
        'console' : false,
        'urlFormat' : '/$controller'
    };
    Sync.createDirIfNotExists('logs');
}

WaferPie.prototype.info = function (message) {
    this._logger.info('[WaferPie] ' + message);
};

/**
 * Initiate an application inside the framework
 * Create the directory structure if it does not exist
 * It loads all application files on memory
 * It is possible to have more then one application running on the same NodeJS lserver
 * It is possible to have one core.json by each host that will run the server
 *
 * @method setUp
 * @param {string} appName The name of application, it will be also used as directory's name
 */
WaferPie.prototype.setUp = function (appName) {
    var app, srcPath, testPath;
    srcPath = path.resolve(path.join(appName, 'src'));
    testPath = path.resolve(path.join(appName, 'test'));
    app = {
        'constants' : {
            'basePath' : path.resolve(path.join(appName)),
            'srcPath' : srcPath,
            'logsPath' : path.resolve(path.join(appName, 'logs')),
            'controllersPath' : path.resolve(path.join(srcPath, 'Controller')),
            'componentsPath' : path.resolve(path.join(srcPath, 'Component')),
            'configPath' : path.resolve(path.join(srcPath, 'Config')),
            'modelsPath' : path.resolve(path.join(srcPath, 'Model')),
            'filtersPath' : path.resolve(path.join(srcPath, 'Filter')),
            'testPath' : testPath,
            'controllersTestPath' : path.resolve(path.join(testPath, 'Controller')),
            'componentsTestPath' : path.resolve(path.join(testPath, 'Component')),
            'modelsTestPath' : path.resolve(path.join(testPath, 'Model')),
            'filtersTestPath' : path.resolve(path.join(testPath, 'Filter'))
        },
        'hostname' : os.hostname()
    };


    (function shouldPointCoreFileBasedOnHost() {
        if (Sync.isFile(path.join(app.constants.srcPath, 'Config', app.hostname, '.json'))) {
            app.coreFileName = path.join(app.constants.srcPath, 'Config', app.hostname, '.json');
        } else {
            app.coreFileName = path.join(app.constants.srcPath, 'Config', 'core.json');
        }
    }());

    Sync.createDirIfNotExists(app.constants.basePath);
    Sync.createDirIfNotExists(app.constants.srcPath);
    Sync.createDirIfNotExists(app.constants.controllersPath);
    Sync.createDirIfNotExists(app.constants.componentsPath);
    Sync.createDirIfNotExists(app.constants.filtersPath);
    Sync.createDirIfNotExists(app.constants.modelsPath);
    Sync.createDirIfNotExists(app.constants.configPath);
    Sync.createDirIfNotExists(app.constants.testPath);
    Sync.createDirIfNotExists(app.constants.controllersTestPath);
    Sync.createDirIfNotExists(app.constants.modelsTestPath);
    Sync.createDirIfNotExists(app.constants.componentsTestPath);
    Sync.createDirIfNotExists(app.constants.filtersTestPath);
    Sync.createDirIfNotExists(app.constants.logsPath);

    Sync.copyIfNotExists(path.join(__dirname, 'Copy', 'core.json'), app.coreFileName);
    Sync.copyIfNotExists(path.join(__dirname, 'Controller', 'Exceptions.js'), path.join('Exceptions.js'));

    app.controllers = this._loadElements(app.constants.controllersPath);
    app.filters = this._loadElements(app.constants.filtersPath);
    app.components = this._loadComponents(app.constants.componentsPath);
    app.models = this._loadElements(app.constants.modelsPath);

    try {
        app.core = Sync.fileToJSON(app.coreFileName);
    } catch (e) {
        throw new exceptions.Fatal('The core configuration file is not a valid JSON', e);
    }

    this._loadAllConfigJSONFiles(app, app.constants.configPath);
    this._validateCoreFile(app.core);
    this._applications[appName] = app;
    this.ExceptionsController = require('./Controller/Exceptions.js');

    this._validateControllers(app.controllers);
    this._validateControllers(app.filters);
    this._validateComponents(app.components);
    this._validateModels(app.models);
};

WaferPie.prototype._validateModels = function (models) {
    var Model, name;
    for (name in models) {
        if (models.hasOwnProperty(name)) {
            Model = models[name];
            if (!(Model instanceof Function)) {
                throw new exceptions.Fatal('Model does not export a function: ' + name);
            }
        }
    }
};

WaferPie.prototype._validateComponents = function (components) {
    var name, Component;
    for (name in components) {
        if (components.hasOwnProperty(name)) {
            Component = components[name];
            if (!(Component instanceof Function)) {
                throw new exceptions.Fatal('Component does not export a function: ' + name);
            }
        }
    }
};

WaferPie.prototype._validateControllers = function (controllers) {
    var methods, name, Controller, instance, methodsLength, methodName, j;
    methods = ['before', 'after', 'put', 'delete', 'get', 'post', 'options', 'head', 'path'];

    for (name in controllers) {
        if (controllers.hasOwnProperty(name)) {
            Controller = controllers[name];
            if (!(Controller instanceof Function)) {
                throw new exceptions.Fatal('Controller does not export a function: ' + name);
            }
            instance = new Controller();
            methodsLength = methods.length;
            for (j = 0; j < methodsLength; j += 1) {
                methodName = methods[j];
                if (instance[methodName] !== undefined) {
                    if (!(instance[methodName] instanceof Function)) {
                        throw new exceptions.Fatal(name + '.' + methodName + '() must be a function!');
                    }
                }
            }
        }
    }
};

WaferPie.prototype._loadAllConfigJSONFiles = function (app, configPath) {
    var files, elementNames = [];
    files = Sync.listFilesFromDir(configPath);
    files.forEach(function (file) {
        var relative, extensionIndex, relativeWithoutExt, elementName;
        if (file.indexOf('.json') !== -1) {
            relative = file.substring(configPath.length + 1);
            extensionIndex = relative.lastIndexOf('.');
            relativeWithoutExt = relative.substring(0, extensionIndex);
            elementName = relativeWithoutExt.replace(/\//g, '.');
            elementNames[elementName] = file;
        }
    });
    app.configs = Sync.loadNodeFilesIntoArray(elementNames);
};

/**
 * Load builtin and application components
 * @param {string} componentsPath Path to the application components
 * @returns {object} Components
 * @private
 */
WaferPie.prototype._loadComponents = function (componentsPath) {
    var components = this._loadElements(path.join(__dirname, 'Component', 'Builtin'));
    var appComponents = this._loadElements(componentsPath);
    var componentName;
    for (componentName in appComponents) {
        if (appComponents.hasOwnProperty(componentName)) {
            components[componentName] = appComponents[componentName];
        }
    }
    return components;
};

WaferPie.prototype._loadElements = function (dirPath) {
    var elementNames = [];
    var files = Sync.listFilesFromDir(dirPath);
    files.forEach(function (file) {
        var relative = file.substring(dirPath.length + 1);
        var extensionIndex = relative.lastIndexOf('.');
        var relativeWithoutExt = relative.substring(0, extensionIndex);
        var elementName = relativeWithoutExt.replace(/\//g, '.');
        elementNames[elementName] = file;
    });
    return Sync.loadNodeFilesIntoArray(elementNames);
};

WaferPie.prototype._validateCoreFile = function (core) {
    if (core.requestTimeout === undefined) {
        throw new exceptions.Fatal('The requestTimeout configuration is not defined');
    }
    if (typeof core.requestTimeout !== 'number') {
        throw new exceptions.Fatal('The requestTimeout configuration is not a number');
    }
};

/**
 * It parses the configuration file, a json object, that controls the framework behavior, such url parameters,
 * data sources, etc...
 *
 * @method configure
 * @param {string} configJSONFile The file name that contains your configuration object
 */
WaferPie.prototype.configure = function (configJSONFile) {
    if (configJSONFile) {
        try {
            this._configs = Sync.fileToJSON(configJSONFile);
        } catch (e) {
            throw new exceptions.Fatal('Configuration file is not a valid JSON', e);
        }
        if ((typeof this._configs.urlFormat) !== 'string') {
            throw new exceptions.Fatal('urlFormat has not been specified or it is not a string');
        }
    }

    this._logger = new Logger('server.log');
    this._logger.config({
        'path' : 'logs',
        'console' : this._configs.debug
    });
    this._logger.init();
    this._configured = true;
};

/**
 * Starts the NodeJS server for all your applications
 *
 * @method start
 * @param {string} address The listening address of NodeJS http.createServer function
 * @param {number} port The listening port of NodeJS http.createServer function
 */
WaferPie.prototype.start = function (address, port) {
    if (!this._configured) {
        throw new exceptions.Fatal('Please call configure() before start()!');
    }

    var $this = this;
    this.info('Starting...');
    http.createServer(function (request, response) {
        var requestHandler = new RequestHandler(
            $this._logger,
            $this._configs,
            $this._applications,
            $this.ExceptionsController,
            $this._version
        );
        requestHandler.process(request, response);
    }).listen(port, address);
    this.info(address + ':' + port);
    this.info('Started!');
};

WaferPie.Testing = require('./Test/Testing');

module.exports = WaferPie;