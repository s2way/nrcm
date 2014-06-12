// Dependencies
var fs = require('fs');
var path = require('path');
var http = require('http');
var exceptions = require('./exceptions');
var sync = require('./sync');
var RequestHandler = require('./RequestHandler');

// Constructor
function NRCM() {
    this.applications = {};
    // Default configurations
    this.configs = {
        'url' : '/$controller'
    };
};

NRCM.prototype.log = function(message) {
    console.log('[NRCM] ' + message);
};

/**
 * Initiate an application inside the framework, it creates the directory`s structure, if it does not exist,
 * and it loads all application`s files on memory
 * It is possible to have more then one application running on the same nodejs server, it works as an alias or
 * as a namespace
 *
 * @method setUp
 * @param {String} appName The name of application, it will be also used as directory`s name
 */
NRCM.prototype.setUp = function(appName) {
    var app = {};

    app.basePath = path.join(appName);
    app.controllersPath = path.join(appName, 'Controller');
    app.componentsPath = path.join(appName, 'Controller', 'Component');
    app.modelsPath = path.join(appName, 'Model');
    app.configPath = path.join(appName, 'Config');
    app.coreFileName = path.join(appName, 'Config', 'core.json');
    app.aclFileName = path.join(appName, 'Config', 'acl.json');

    // Directory creation
    sync.createDirIfNotExists(app.basePath);
    sync.createDirIfNotExists(app.controllersPath);
    sync.createDirIfNotExists(app.componentsPath);
    sync.createDirIfNotExists(app.modelsPath);
    sync.createDirIfNotExists(app.configPath);

    // Acl file creation
    sync.copyIfNotExists(path.join('src', 'acl.json'), app.aclFileName);
    // Core file creation
    sync.copyIfNotExists(path.join('src', 'core.json'), app.coreFileName);
    // ExceptionsController creation
    sync.copyIfNotExists(path.join('src', 'ExceptionsController.js'), path.join('ExceptionsController.js'));

    // Controller load
    app.controllers = sync.loadNodeFilesIntoArray(sync.listFilesFromDir(app.controllersPath));
    // Components load
    app.components = sync.loadNodeFilesIntoArray(sync.listFilesFromDir(app.componentsPath));
    // Models Load
    app.models = sync.loadNodeFilesIntoArray(sync.listFilesFromDir(app.modelsPath));
    // Loads acl file
    app.acl = sync.fileToJSON(app.aclFileName);
    // Loads core file
    app.core = sync.fileToJSON(app.coreFileName);

    this.ExceptionsController = require('./ExceptionsController.js');

    this.applications[appName] = app;

    // Validate the controllers format
    for (var name in app.controllers) {
        var Controller = app.controllers[name];
        if (!(Controller instanceof Function)) {
            throw new exceptions.Fatal('Controller does not export a function: ' + name);
        }
        var instance = new Controller();
        var methods = ['before', 'after', 'put', 'delete', 'get', 'post'];
        methods.forEach(function(methodName) {
            if (instance[methodName] !== undefined) {
                if (!(instance[methodName] instanceof Function)) {
                    throw new exceptions.Fatal(name + '.' + methodName + '() must be a function!');
                }
            }
        });
    }

    // Validate the components format
    for (var name in app.components) {
        var Component = app.components[name];
        if (!(Component instanceof Function)) {
            throw new exceptions.Fatal('Component does not export a function: ' + name);
        }
    }

    // Validate the models format
    for (var name in app.models) {
        var Model = app.models[name];
        if (!(Model instanceof Function)) {
            throw new exceptions.Fatal('Model does not export a function: ' + name);
        }
    }

}

/**
 * It parses the configuration file, a json object, that controls the framework behavior, such url parameters,
 * data sources, etc...
 *
 * @method configure
 * @param {JSONObject} configJSONFile The file name that contains your configuration object
 */
NRCM.prototype.configure = function(configJSONFile) {
    try {
        this.configs = sync.fileToJSON(configJSONFile);
    } catch (e) {
        throw new exceptions.Fatal('Configuration file is not a valid JSON', e);
    }
    // Validate the json object within configuration`s file
    if ((typeof this.configs.urlFormat) !== 'string') {
        throw new exceptions.Fatal('urlFormat is not a string');
    }
}

/**
 * Starts the nodejs server for all your applications
 *
 * @method start
 * @param {String} address The listening address of nodejs http.createServer function
 * @param {Number} port The listening port of nodejs http.createServer function
 */
NRCM.prototype.start = function(address, port) {
    this.log('Starting...');

    var requestHandler = new RequestHandler(this.configs, this.applications, this.ExceptionsController);
    http.createServer(function(request, response){
        requestHandler.process(request, response);
    }).listen(port, address);
    this.log(address + ':' + port);
    this.log('Started!');
};

module.exports = NRCM;
