path = require 'path'
fs = require 'fs'
ElementManager = require '../Core/ElementManager'
RequestHandler = require '../Controller/RequestHandler'
Cherries = require '../Util/Cherries'
Router = require '../Core/Router'
Request = require '../Controller/Request'
Response = require '../Controller/Response'

# Testing tool constructor
# @constructor
# @param {string} applicationPath The path of your application
# @param {json} core Mocked core.json object
class Testing
    constructor: (applicationPath, @_core = {}, @_serverConfigs = {}) ->
        @_core.requestTimeout = @_core.requestTimeout ? 1000
        @_core.dataSources = @_core.dataSources ? {}
        @_serverConfigs.urlFormat = @_serverConfigs.urlFormat ? '/$application/$controller'
        @_applicationPath = applicationPath
        @_controllers = {}
        @_components = {}
        @_models = {}

        @_application =
            controllers: @_controllers
            components: @_components
            models: @_models
            core: @_core

        @_applications = app: @_application

        # Necessary for testing Components and Models
        # When you are testing the Controllers, RequestHandler has its own ElementManager
        @_elementManager= new ElementManager null, @_application
        @_cherries = new Cherries

    mockConfigs: (configs) -> @_applications.app.configs = configs

    # Call require
    # Necessary for mocking in the tests
    # @param path
    # @returns {Object|*}
    # @private
    _require: (path) -> require path

    # Call fs.existsSync
    # Necessary for mocking in the tests
    # @param path
    # @returns {*}
    # @private
    _exists: (path) -> fs.existsSync path

    # Loads, creates and returns the model instance or null if not found
    # @param {string} modelName The model name
    # @param {object} params Parameters to be passed to the model constructor
    # @returns {object} The model instance or null
    createModel: (modelName, params) ->
        @loadModel modelName
        @_elementManager.create('model', modelName, params)

    # Loads, creates, and returns the component instance or null if not found
    # @param {string} componentName The name of the component
    # @params {object} params Parameters that will be passed to the component constructor
    # @returns {object} The component instance or null
    createComponent: (componentName, params) ->
        @loadComponent componentName
        @_elementManager.create('component', componentName, params)

    loadModel: (modelName) ->
        modelsPath = path.join(@_applicationPath, 'src', 'Model', @_cherries.elementNameToPath(modelName))
        allowedExtensions = ['coffee', 'js']
        for ext in allowedExtensions
            if @_exists(modelsPath + '.' + ext)
                @_models[modelName] = @_require(modelsPath)
                return true
        throw
        name: 'ModelNotFound'
        model: modelName


    # Loads a component
    # You have to load all dependent components that you do not want to mock in your tests, including built-ins (QueryBuilder, etc)
    # @param {string} componentName The name of the component
    loadComponent: (componentName) ->
        componentNameAsPath = @_cherries.elementNameToPath(componentName)
        applicationComponentPath = path.join(@_applicationPath, 'src', 'Component', componentNameAsPath)
        builtinComponentPath = path.join(__dirname, '..', 'Component', 'Builtin', componentNameAsPath)

        allowedExtensions = ['coffee', 'js']
        for ext in allowedExtensions
            if @_exists(applicationComponentPath + '.' + ext)
                @_components[componentName] = @_require(applicationComponentPath)
                return true
            if @_exists(builtinComponentPath + '.' + ext)
                @_components[componentName] = @_require(builtinComponentPath)
                return true

        throw
        name: 'ComponentNotFound'
        component: componentName

    # Loads a model an then mocks its methods
    # @param {string} modelName The name of the model
    # @param {object} methods A JSON containing methods that will be injected into the model instance
    mockModel: (modelName, methods) ->
        @loadModel modelName
        for methodName of methods
            @_applications.app.models[modelName].prototype[methodName] = methods[methodName]

    # Loads a component an then mocks its components
    # @param {string} componentName The name of the component
    # @param {object} methods A JSON containing methods taht will be injected into the component instance
    mockComponent: (componentName, methods) ->
        @loadComponent componentName
        for methodName of methods
            @_applications.app.components[componentName].prototype[methodName] = methods[methodName]

    # Call a controller method for testing
    # @param {string} controllerName The name of the controller to be called
    # @param {string} httpMethod HTTP method
    # @param {object} options Some options, including payload, query, segments, prefixes
    # @param {function} callback Function that will be called when the call is complete.
    # An object containing statusCode, headers, and contentType is passed to the callback.
    callController: (controllerName, httpMethod, options, callback) ->
        controllerPath = path.join(@_applicationPath, 'src', 'Controller', @_cherries.elementNameToPath(controllerName))
        @_controllers[controllerName] = @_require(controllerPath)

        router = new Router @_serverConfigs.urlFormat
        url = router.compose(
            application: 'app'
            controller: controllerName
            prefixes: options.prefixes
            segments: options.segments
        )
        request = new Request
            url: url
            method: httpMethod
        request.receive = (callback) ->
            callback options.payload
        response = new Response
        response.send = (body, headers, statusCode) ->
            callback body,
                headers: headers
                statusCode: statusCode

        requestHandler = new RequestHandler(@_applications, @_serverConfigs)
        requestHandler.process request, response

module.exports = Testing