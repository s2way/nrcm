/*jslint devel: true, node: true, indent: 4, vars: true, maxlen: 256 */
'use strict';
// Dependencies
var fs = require('fs');
var path = require('path');
var http = require('http');
var exceptions = require('./exceptions');
var sync = require('./Util/sync');
var logger = require('./Util/logger');
var RequestHandler = require('./Controller/RequestHandler');

// Constructor
function NRCM() {
    this.applications = {};
    // Default configurations
    this.configs = {
        'url' : '/$controller'
    };
}

// Log
NRCM.prototype.log = function (message) {
    logger.info('[NRCM] ' + message);
};

/**
 * Initiate an application inside the framework
 * Create the directory structure if it does not exist
 * It loads all application files on memory
 * It is possible to have more then one application running on the same nodejs server
 *
 * @method setUp
 * @param {string} appName The name of application, it will be also used as directory's name
 */
NRCM.prototype.setUp = function (appName) {
    var app = {}, name;
    app.basePath = path.join(appName);
    app.srcPath = path.join(appName, 'src');
    app.controllersPath = path.join(app.srcPath, 'Controller');
    app.componentsPath = path.join(app.srcPath, 'Component');
    app.modelsPath = path.join(app.srcPath, 'Model');
    app.configPath = path.join(app.srcPath, 'Config');
    app.coreFileName = path.join(app.srcPath, 'Config', 'core.json');
    app.aclFileName = path.join(app.srcPath, 'Config', 'acl.json');

    app.testPath = path.join(appName, 'test');
    app.controllersTestPath = path.join(app.testPath, 'Controller');
    app.componentsTestPath = path.join(app.testPath, 'Component');
    app.modelsTestPath = path.join(app.testPath, 'Model');

    // src directory creation
    sync.createDirIfNotExists(app.basePath);
    sync.createDirIfNotExists(app.srcPath);
    sync.createDirIfNotExists(app.controllersPath);
    sync.createDirIfNotExists(app.componentsPath);
    sync.createDirIfNotExists(app.modelsPath);
    sync.createDirIfNotExists(app.configPath);
    // test directory creation
    sync.createDirIfNotExists(app.testPath);
    sync.createDirIfNotExists(app.controllersTestPath);
    sync.createDirIfNotExists(app.modelsTestPath);
    sync.createDirIfNotExists(app.componentsTestPath);

    // Acl file creation
    sync.copyIfNotExists(path.join(__dirname, 'Copy', 'acl.json'), app.aclFileName);
    // Core file creation
    sync.copyIfNotExists(path.join(__dirname, 'Copy', 'core.json'), app.coreFileName);
    // ExceptionsController creation
    sync.copyIfNotExists(path.join(__dirname, 'Controller', 'ExceptionsController.js'), path.join('ExceptionsController.js'));
    // Controller load
    app.controllers = sync.loadNodeFilesIntoArray(sync.listFilesFromDir(app.controllersPath));
    // Components load
    app.components = sync.loadNodeFilesIntoArray(sync.listFilesFromDir(app.componentsPath));
    // Models Load
    app.models = sync.loadNodeFilesIntoArray(sync.listFilesFromDir(app.modelsPath));
    // Loads acl file
    app.acl = sync.fileToJSON(app.aclFileName);
    // Load the core configuration file of the application
    try {
        app.core = sync.fileToJSON(app.coreFileName);
    } catch (e) {
        throw new exceptions.Fatal('The core configuration file is not a valid JSON', e);
    }

    this.applications[appName] = app;

    this.ExceptionsController = require('./Controller/ExceptionsController.js');
    // Validate the controllers format
    var Controller, instance, methodsLength, methodName, j;
    var methods = ['before', 'after', 'put', 'delete', 'get', 'post', 'options', 'head', 'path'];

    for (name in app.controllers) {
        if (app.controllers.hasOwnProperty(name)) {
            Controller = app.controllers[name];
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
    // Validate the components format
    var Component;
    for (name in app.components) {
        if (app.components.hasOwnProperty(name)) {
            Component = app.components[name];
            if (!(Component instanceof Function)) {
                throw new exceptions.Fatal('Component does not export a function: ' + name);
            }
        }
    }
    // Validate the models format
    var Model;
    for (name in app.models) {
        if (app.models.hasOwnProperty(name)) {
            Model = app.models[name];
            if (!(Model instanceof Function)) {
                throw new exceptions.Fatal('Model does not export a function: ' + name);
            }
        }
    }
};

/**
 * It parses the configuration file, a json object, that controls the framework behavior, such url parameters,
 * data sources, etc...
 *
 * @method configure
 * @param {json} configJSONFile The file name that contains your configuration object
 */
NRCM.prototype.configure = function (configJSONFile) {
    try {
        this.configs = sync.fileToJSON(configJSONFile);
    } catch (e) {
        throw new exceptions.Fatal('Configuration file is not a valid JSON', e);
    }
    // Validate the json object within configuration's file
    if ((typeof this.configs.urlFormat) !== 'string') {
        throw new exceptions.Fatal('urlFormat has not been specified or it is not a string');
    }
    if (typeof this.configs.requestTimeout !== 'number') {
        throw new exceptions.Fatal('requestTimeout has not been specified or it is not a number');
    }
};

/**
 * Starts the nodejs server for all your applications
 *
 * @method start
 * @param {string} address The listening address of nodejs http.createServer function
 * @param {number} port The listening port of nodejs http.createServer function
 */
NRCM.prototype.start = function (address, port) {
    var $this = this;
    this.log('Starting...');
    http.createServer(function (request, response) {
        var requestHandler = new RequestHandler(
            $this.configs,
            $this.applications,
            $this.ExceptionsController
        );
        requestHandler.process(request, response);
    }).listen(port, address);
    this.log(address + ':' + port);
    this.log('Started!');
};

// Testing tools
NRCM.Testing = require('./Test/Testing');

module.exports = NRCM;