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

NRCM.prototype.setUp = function(appName) {
    var app = {};

    app.basePath = path.join(appName);
    app.controllersPath = path.join(appName, 'Controller');
    app.componentsPath = path.join(appName, 'Controller', 'Component');
    app.configPath = path.join(appName, 'Config');
    app.coreFileName = path.join(appName, 'Config', 'core.json');
    app.aclFileName = path.join(appName, 'Config', 'acl.json');

    // Directory creation
    sync.createDirIfNotExists(app.basePath);
    sync.createDirIfNotExists(app.controllersPath); 
    sync.createDirIfNotExists(app.componentsPath); 
    sync.createDirIfNotExists(app.configPath);

    // Acl file creation
    sync.copyIfNotExists(path.join('lib', 'acl.json'), app.aclFileName);
    // Core file creation
    sync.copyIfNotExists(path.join('lib', 'core.json'), app.coreFileName);
    // ExceptionsController creation
    sync.copyIfNotExists(path.join('lib', 'ExceptionsController.js'), path.join('ExceptionsController.js'));

    // Controller load
    app.controllers = sync.loadNodeFilesIntoArray(sync.listFilesFromDir(app.controllersPath));
    // Components load
    app.components = sync.loadNodeFilesIntoArray(sync.listFilesFromDir(app.componentsPath));
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
}

NRCM.prototype.configure = function(configJSONFile) {
    try {
        this.configs = sync.fileToJSON(configJSONFile);
    } catch (e) {
        throw new exceptions.Fatal('Configuration file is not a valid JSON', e);
    }
    // Valida o arquivo de configurações
    if ((typeof this.configs.urlFormat) !== 'string') {
        throw new exceptions.Fatal('urlFormat is not a string');
    }
}

/**
 * Starts the application
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