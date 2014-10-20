path = require("path")
fs = require("fs")
ElementFactory = require("../Core/ElementFactory")
RequestHandler = require("../Controller/RequestHandler")
Cherries = require("../Util/Cherries")

# Testing tool constructor
# @constructor
# @param {string} applicationPath The path of your application
# @param {json} core Mocked core.json object
Testing = (applicationPath, core) ->
    @core = core or {}
    @core.requestTimeout = @core.requestTimeout or 1000
    @core.dataSources = @core.dataSources or {}
    @applicationPath = applicationPath
    @controllers = {}
    @components = {}
    @models = {}
    logger =
        log: ->
        info: ->
        debug: ->
        error: ->
        warn: ->

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
    return

Testing::mockConfigs = (configs) ->
    @applications.app.configs = configs
    return

# Call require
# Necessary for mocking in the tests
# @param path
# @returns {Object|*}
# @private
Testing::_require = (path) ->
    require path

# Call fs.existsSync
# Necessary for mocking in the tests
# @param path
# @returns {*}
# @private
Testing::_exists = (path) ->
    fs.existsSync path

# Loads, creates and returns the model instance or null if not found
# @param {string} modelName The model name
# @returns {object} The model instance or null
Testing::createModel = (modelName) ->
    $this = undefined
    instance = undefined
    $this = this
    @loadModel modelName
    instance = @elementFactory.create("model", modelName)
    instance.model = (modelName) ->
        $this._model modelName

    instance.component = (componentName, params) ->
        $this._component componentName, params

    instance


# Loads, creates, and returns the component instance or null if not found
# @param {string} componentName The name of the component
# @returns {object} The component instance or null
Testing::createComponent = (componentName) ->
    $this = undefined
    instance = undefined
    $this = this
    @loadComponent componentName
    instance = @elementFactory.create("component", componentName)
    instance.model = (modelName) ->
        $this._model modelName

    instance.component = (componentName, params) ->
        $this._component componentName, params

    instance

Testing::loadModel = (modelName) ->
    modelsPath = path.join(@applicationPath, "src", "Model", @cherries.elementNameToPath(modelName))
    allowedExtensions = ['coffee', 'js']
    for ext in allowedExtensions
        if @_exists(modelsPath + '.' + ext)
            @models[modelName] = @_require(modelsPath)
            return
    throw
    name: "ModelNotFound"
    model: modelName


# Loads a component
# You have to load all dependent components that you do not want to mock in your tests, including built-ins (QueryBuilder, etc)
# @param {string} componentName The name of the component
Testing::loadComponent = (componentName) ->
    componentNameAsPath = undefined
    applicationComponentPath = undefined
    builtinComponentPath = undefined
    componentNameAsPath = @cherries.elementNameToPath(componentName)
    applicationComponentPath = path.join(@applicationPath, "src", "Component", componentNameAsPath)
    builtinComponentPath = path.join(__dirname, "..", "Component", "Builtin", componentNameAsPath)

    allowedExtensions = ['coffee', 'js']
    for ext in allowedExtensions
        if @_exists(applicationComponentPath + '.' + ext)
            @components[componentName] = @_require(applicationComponentPath)
            return
        if @_exists(builtinComponentPath + '.' + ext)
            @components[componentName] = @_require(builtinComponentPath)
            return

    throw
    name: "ComponentNotFound"
    component: componentName

# Loads a model an then mocks its methods
# @param {string} modelName The name of the model
# @param {object} methods A JSON containing methods that will be injected into the model instance
Testing::mockModel = (modelName, methods) ->
    @loadModel modelName
    @mockedMethods.models[modelName] = methods
    return


# Loads a component an then mocks its components
# @param {string} componentName The name of the component
# @param {object} methods A JSON containing methods taht will be injected into the component instance
Testing::mockComponent = (componentName, methods) ->
    @loadComponent componentName
    @mockedMethods.components[componentName] = methods
    return

Testing::_model = (modelName) ->
    $this = undefined
    modelInstance = undefined
    methods = undefined
    methodName = undefined
    $this = this
    modelInstance = @elementFactory.create("model", modelName)
    return null  if modelInstance is null
    methods = @mockedMethods.models[modelName]
    if methods isnt undefined
        for methodName of methods
            modelInstance[methodName] = methods[methodName]  if methods.hasOwnProperty(methodName)
    modelInstance.component = (componentName, params) ->
        $this._component componentName, params

    modelInstance.model = (modelName) ->
        $this._model modelName

    @elementFactory.init modelInstance
    modelInstance

Testing::_component = (componentName, params) ->
    $this = undefined
    componentInstance = undefined
    methods = undefined
    methodName = undefined
    $this = this
    componentInstance = @elementFactory.create("component", componentName, params)
    return null  if componentInstance is null
    methods = @mockedMethods.components[componentName]
    if methods isnt undefined
        for methodName of methods
            componentInstance[methodName] = methods[methodName]  if methods.hasOwnProperty(methodName)
    componentInstance.component = (componentName, params) ->
        $this._component componentName, params

    componentInstance.model = (modelName) ->
        $this._model modelName

    @elementFactory.init componentInstance
    componentInstance


# Call a controller method for testing
# @param {string} controllerName The name of the controller to be called
# @param {string} httpMethod HTTP method
# @param {object} options Some options, including payload, query, and segments
# @param {function} callback Function that will be called when the call is complete.
# An object containing statusCode, headers, and contentType is passed to the callback.
Testing::callController = (controllerName, httpMethod, options, callback) ->
    $this = undefined
    controllerPath = undefined
    responseStatusCode = undefined
    responseContentType = undefined
    responseHeaders = undefined
    instance = undefined
    blankFunction = undefined
    requestHandler = undefined
    $this = this
    controllerPath = path.join(@applicationPath, "src", "Controller", @cherries.elementNameToPath(controllerName))
    responseHeaders = {}
    blankFunction = ->
        return

    @controllers[controllerName] = @_require(controllerPath)
    requestHandler = new RequestHandler(
        log: blankFunction
        debug: blankFunction
        info: blankFunction
        error: blankFunction
        warn: blankFunction
    , @core, @applications, null)
    requestHandler.segments = options.segments
    requestHandler._endRequest = (callback) ->
        setImmediate callback
        return

    requestHandler._headers = ->
        []

    requestHandler._receivePayload = ->
        if options.payload is undefined
            @payload = ""
        else if typeof options.payload is "object"
            @payload = (if options.payload is null then "" else JSON.stringify(options.payload))
        else
            @payload = options.payload.toString()
        return

    requestHandler.handleRequestException = (e) ->
        console.log e
        throw ereturn

    requestHandler._writeResponse = blankFunction
    requestHandler._sendResponse = blankFunction
    requestHandler.info = blankFunction
    requestHandler.debug = blankFunction
    requestHandler._writeHead = (statusCode, contentType) ->
        responseStatusCode = statusCode
        responseContentType = contentType
        return

    requestHandler._setHeader = (name, value) ->
        responseHeaders[name] = value
        return

    requestHandler.query = options.query or {}
    requestHandler.prefixes = options.prefixes or {}
    requestHandler.appName = "app"
    instance = requestHandler.prepareController(controllerName)
    requestHandler.elementFactory = @elementFactory
    instance.model = (modelName) ->
        $this._model modelName

    instance.component = (componentName, params) ->
        $this._component componentName, params

    requestHandler.invokeController instance, httpMethod, ->
        callback JSON.parse(requestHandler.stringOutput),
            statusCode: responseStatusCode
            contentType: responseContentType
            headers: responseHeaders

        return

    @options = options
    return

module.exports = Testing