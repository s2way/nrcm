path = require 'path'
fs = require 'fs'
ElementFactory = require '../Core/ElementFactory'
RequestHandler = require '../Controller/RequestHandler'
Cherries = require '../Util/Cherries'

# Testing tool constructor
# @constructor
# @param {string} applicationPath The path of your application
# @param {json} core Mocked core.json object
class Testing
    constructor: (applicationPath, @core = {}) ->
        @core.requestTimeout = @core.requestTimeout ? 1000
        @core.dataSources = @core.dataSources ? {}
        @applicationPath = applicationPath
        @controllers = {}
        @components = {}
        @models = {}
        logger =
            log: -> return
            info: -> return
            debug: -> return
            error: -> return
            warn: -> return

        @application =
            controllers: @controllers
            components: @components
            models: @models
            core: @core
            logger: logger

        @mockedMethods =
            components: {}
            models: {}

        @applications = app: @application

        # Necessary for testing Components and Models
        # When you are testing the Controllers, RequestHandler has its own ElementFactory
        @elementFactory = new ElementFactory(logger, @application)
        @cherries = new Cherries()

    mockConfigs: (configs) -> @applications.app.configs = configs

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
        self = this
        @loadModel modelName
        instance = @elementFactory.create('model', modelName, params)
        instance.model = (modelName) -> self._model modelName
        instance.component = (componentName, params) -> self._component componentName, params
        instance

    # Loads, creates, and returns the component instance or null if not found
    # @param {string} componentName The name of the component
    # @params {object} params Parameters that will be passed to the component constructor
    # @returns {object} The component instance or null
    createComponent: (componentName, params) ->
        self = this
        @loadComponent componentName
        instance = @elementFactory.create('component', componentName, params)
        instance.model = (modelName) ->
            self._model modelName

        instance.component = (componentName, params) ->
            self._component componentName, params

        instance

    loadModel: (modelName) ->
        modelsPath = path.join(@applicationPath, 'src', 'Model', @cherries.elementNameToPath(modelName))
        allowedExtensions = ['coffee', 'js']
        for ext in allowedExtensions
            if @_exists(modelsPath + '.' + ext)
                @models[modelName] = @_require(modelsPath)
                return
        throw
        name: 'ModelNotFound'
        model: modelName


    # Loads a component
    # You have to load all dependent components that you do not want to mock in your tests, including built-ins (QueryBuilder, etc)
    # @param {string} componentName The name of the component
    loadComponent: (componentName) ->
        componentNameAsPath = @cherries.elementNameToPath(componentName)
        applicationComponentPath = path.join(@applicationPath, 'src', 'Component', componentNameAsPath)
        builtinComponentPath = path.join(__dirname, '..', 'Component', 'Builtin', componentNameAsPath)

        allowedExtensions = ['coffee', 'js']
        for ext in allowedExtensions
            if @_exists(applicationComponentPath + '.' + ext)
                @components[componentName] = @_require(applicationComponentPath)
                return
            if @_exists(builtinComponentPath + '.' + ext)
                @components[componentName] = @_require(builtinComponentPath)
                return

        throw
        name: 'ComponentNotFound'
        component: componentName

    # Loads a model an then mocks its methods
    # @param {string} modelName The name of the model
    # @param {object} methods A JSON containing methods that will be injected into the model instance
    mockModel: (modelName, methods) ->
        @loadModel modelName
        @mockedMethods.models[modelName] = methods

    # Loads a component an then mocks its components
    # @param {string} componentName The name of the component
    # @param {object} methods A JSON containing methods taht will be injected into the component instance
    mockComponent: (componentName, methods) ->
        @loadComponent componentName
        @mockedMethods.components[componentName] = methods

    _model: (modelName) ->
        self = this
        modelInstance = @elementFactory.create('model', modelName)
        return null  if modelInstance is null
        methods = @mockedMethods.models[modelName]
        if methods isnt undefined
            for methodName of methods
                modelInstance[methodName] = methods[methodName]  if methods.hasOwnProperty(methodName)
        modelInstance.component = (componentName, params) ->
            self._component componentName, params

        modelInstance.model = (modelName) ->
            self._model modelName

        @elementFactory.init modelInstance
        modelInstance

    _component: (componentName, params) ->
        self = this
        componentInstance = @elementFactory.create('component', componentName, params)
        return null  if componentInstance is null
        methods = @mockedMethods.components[componentName]
        if methods isnt undefined
            for methodName of methods
                componentInstance[methodName] = methods[methodName]  if methods.hasOwnProperty(methodName)
        componentInstance.component = (componentName, params) ->
            self._component componentName, params

        componentInstance.model = (modelName) ->
            self._model modelName

        @elementFactory.init componentInstance
        componentInstance


    # Call a controller method for testing
    # @param {string} controllerName The name of the controller to be called
    # @param {string} httpMethod HTTP method
    # @param {object} options Some options, including payload, query, and segments
    # @param {function} callback Function that will be called when the call is complete.
    # An object containing statusCode, headers, and contentType is passed to the callback.
    callController: (controllerName, httpMethod, options, callback) ->
        responseStatusCode = null
        responseContentType = null
        self = this
        controllerPath = path.join(@applicationPath, 'src', 'Controller', @cherries.elementNameToPath(controllerName))
        responseHeaders = {}

        @controllers[controllerName] = @_require(controllerPath)
        requestHandler = new RequestHandler(
            log: -> return
            debug: -> return
            info: -> return
            error: -> return
            warn: -> return
        , @core, @applications, null)
        requestHandler.segments = options.segments
        requestHandler._endRequest = (callback) ->setImmediate callback

        requestHandler._headers = -> []

        requestHandler._receivePayload = ->
            if options.payload is undefined
                @payload = ''
            else if typeof options.payload is 'object'
                @payload = (if options.payload is null then '' else JSON.stringify(options.payload))
            else
                @payload = options.payload.toString()

        requestHandler.handleRequestException = (e) ->
            console.log e
            throw e

        requestHandler._writeResponse = -> return
        requestHandler._sendResponse = -> return
        requestHandler.info = -> return
        requestHandler.debug = -> return
        requestHandler._writeHead = (statusCode, contentType) ->
            responseStatusCode = statusCode
            responseContentType = contentType

        requestHandler._setHeader = (name, value) ->
            responseHeaders[name] = value

        requestHandler.query = options.query or {}
        requestHandler.prefixes = options.prefixes or {}
        requestHandler.appName = 'app'
        instance = requestHandler.prepareController(controllerName)
        requestHandler.elementFactory = @elementFactory
        instance.model = (modelName) -> self._model modelName
        instance.component = (componentName, params) -> self._component componentName, params

        requestHandler.invokeController instance, httpMethod, ->
            callback JSON.parse(requestHandler.stringOutput),
                statusCode: responseStatusCode
                contentType: responseContentType
                headers: responseHeaders

        @options = options

module.exports = Testing