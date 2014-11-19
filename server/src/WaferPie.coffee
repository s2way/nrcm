# Copyright 2014 Versul Tecnologias Ltda

# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

# http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

require 'coffee-script/register'
require('better-require')()

path = require 'path'
http = require 'http'
Exceptions = require './Util/Exceptions'
Sync = require './Util/Sync'
Logger = require './Component/Builtin/Logger'
RequestHandler = require './Controller/RequestHandler'
Request = require './Controller/Request'
Response = require './Controller/Response'
os = require 'os'
Supervisor = require './Util/Supervisor'

class WaferPie
    constructor: ->
        @_applications = {}
        @_configured = false
        @_configs =
            console: false
            urlFormat: '/$controller'
        @_monitoring =
            requests: 0
            responseAvg: 0.00
        @_version = '0.9.0'
        Sync.createDirIfNotExists 'logs'

    info: (message) -> @_logger.info '[WaferPie] ' + message

    # Initiate an application inside the framework
    # Create the directory structure if it does not exist
    # It loads all application files on memory
    # It is possible to have more then one application running on the same NodeJS server
    # It is possible to have one core.json by each host that will run the server
    # @method setUp
    # @param {string} appName The name of application, it will be also used as directory's name
    setUp: (appName) ->
        srcPath = path.resolve(path.join(appName, 'src'))
        testPath = path.resolve(path.join(appName, 'test'))
        app =
            constants:
                basePath: path.resolve(path.join(appName))
                srcPath: srcPath
                logsPath: path.resolve(path.join(appName, 'logs'))
                controllersPath: path.resolve(path.join(srcPath, 'Controller'))
                componentsPath: path.resolve(path.join(srcPath, 'Component'))
                configPath: path.resolve(path.join(srcPath, 'Config'))
                modelsPath: path.resolve(path.join(srcPath, 'Model'))
                filtersPath: path.resolve(path.join(srcPath, 'Filter'))
                testPath: testPath
                controllersTestPath: path.resolve(path.join(testPath, 'Controller'))
                componentsTestPath: path.resolve(path.join(testPath, 'Component'))
                modelsTestPath: path.resolve(path.join(testPath, 'Model'))
                filtersTestPath: path.resolve(path.join(testPath, 'Filter'))
            hostname: os.hostname()

        if Sync.isFile(path.join(app.constants.srcPath, 'Config', app.hostname + '.json'))
            app.coreFileName = path.join(app.constants.srcPath, 'Config', app.hostname + '.json')
        else if Sync.isFile(path.join(app.constants.srcPath, 'Config', app.hostname + '.yml'))
            app.coreFileName = path.join(app.constants.srcPath, 'Config', app.hostname + '.yml')
        else
            app.coreFileName = path.join(app.constants.srcPath, 'Config', 'core.json')

        pathsToCreate = app.constants
        for i of pathsToCreate
            Sync.createDirIfNotExists pathsToCreate[i] if pathsToCreate.hasOwnProperty i

        Sync.copyIfNotExists path.join(__dirname, 'Copy', 'core.json'), app.coreFileName

        app.controllers = @_loadElements(app.constants.controllersPath)
        app.filters = @_loadElements(app.constants.filtersPath)
        app.components = @_loadComponents(app.constants.componentsPath)
        app.models = @_loadElements(app.constants.modelsPath)

        try
            app.core = require(app.coreFileName)
        catch e
            throw new Exceptions.Fatal('The core configuration file is not valid', e)

        @_loadAllConfigJSONFiles app, app.constants.configPath
        @_validateCoreFile app.core

        @_applications[appName] = app

        @_validateControllers app.controllers
        @_validateControllers app.filters
        @_validateComponents app.components
        @_validateModels app.models

    _validateModels: (models) ->
        for name of models
            if models.hasOwnProperty(name)
                Model = models[name]
                throw new Exceptions.Fatal('Model does not export a function: ' + name)  unless Model instanceof Function

    _validateComponents: (components) ->
        for name of components
            if components.hasOwnProperty(name)
                Component = components[name]
                throw new Exceptions.Fatal('Component does not export a function: ' + name)  unless Component instanceof Function

    _validateControllers: (controllers) ->
        methods = ['before', 'after', 'put', 'delete', 'get', 'post', 'options', 'head', 'path']
        for name of controllers
            if controllers.hasOwnProperty(name)
                Controller = controllers[name]
                throw new Exceptions.Fatal('Controller does not export a function: ' + name)  unless Controller instanceof Function
                instance = new Controller()
                methodsLength = methods.length
                j = 0
                while j < methodsLength
                    methodName = methods[j]
                    if instance[methodName] isnt undefined
                        throw new Exceptions.Fatal(name + '.' + methodName + '() must be a function!') unless instance[methodName] instanceof Function
                    j += 1

    _loadAllConfigJSONFiles: (app, configPath) ->
        elementNames = []
        files = Sync.listFilesFromDir(configPath)
        files.forEach (file) ->
            if file.indexOf('.json') isnt -1
                relative = file.substring(configPath.length + 1)
                extensionIndex = relative.lastIndexOf('.')
                relativeWithoutExt = relative.substring(0, extensionIndex)
                elementName = relativeWithoutExt.replace(/\//g, '.')
                elementNames[elementName] = file

            app.configs = Sync.loadNodeFilesIntoArray(elementNames)


    # Load builtin and application components
    # @param {string} componentsPath Path to the application components
    # @returns {object} Components
    # @private
    _loadComponents: (componentsPath) ->
        components = @_loadElements(path.join(__dirname, 'Component', 'Builtin'))
        appComponents = @_loadElements(componentsPath)
        for componentName of appComponents
            components[componentName] = appComponents[componentName] if appComponents.hasOwnProperty(componentName)
        components

    _loadElements: (dirPath) ->
        elementNames = []
        files = Sync.listFilesFromDir(dirPath)
        files.forEach (file) ->
            relative = file.substring(dirPath.length + 1)
            extensionIndex = relative.lastIndexOf('.')
            relativeWithoutExt = relative.substring(0, extensionIndex)
            elementName = relativeWithoutExt.replace(/\//g, '.')
            elementNames[elementName] = file

        Sync.loadNodeFilesIntoArray elementNames

    _validateCoreFile: (core) ->
        throw new Exceptions.Fatal('The requestTimeout configuration is not defined') if core.requestTimeout is undefined
        throw new Exceptions.Fatal('The requestTimeout configuration is not a number') if typeof core.requestTimeout isnt 'number'

    # It parses the configuration file, a json object, that controls the framework behavior, such url parameters,
    # data sources, etc...
    # @method configure
    # @param {string} configFile The file name that contains your configuration object
    configure: (configFile) ->
        if configFile
            try
                @_configs = require(path.resolve('./' + configFile))
            catch e
                throw new Exceptions.Fatal('Configuration file is not a valid configuration file', e)
            throw new Exceptions.Fatal('urlFormat has not been specified or it is not a string')  if typeof @_configs.urlFormat isnt 'string'
        @_logger = new Logger('server.log')
        @_logger.config
            path: 'logs'
            console: @_configs.debug

        @_logger.init()
        @_supervisor = new Supervisor @_logger, @_configs.supervisor, @_monitoring
        @_supervisor.run()
        @_configured = true

    # Starts the NodeJS server for all your applications
    # @method start
    # @param {string} address The listening address of NodeJS http.createServer function
    # @param {number} port The listening port of NodeJS http.createServer function
    start: (address, port) ->
        throw new Exceptions.Fatal('Please call configure() before start()!') unless @_configured
        @info 'Starting...'
        http.createServer((request, response) =>
            requestHandler = new RequestHandler @_applications, @_configs, @_logger, @_monitoring, @_version
            requestHandler.process new Request(request), new Response(response)
        ).listen port, address
        @info address + ':' + port
        @info 'Started!'

WaferPie.Testing = require './Test/Testing'
module.exports = WaferPie
