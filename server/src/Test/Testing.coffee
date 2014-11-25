path = require 'path'
fs = require 'fs'
ElementManager = require '../Core/ElementManager'
FilterFactory = require '../Controller/FilterFactory'
RequestHandler = require '../Controller/RequestHandler'
Cherries = require '../Component/Builtin/Cherries'
Router = require '../Core/Router'
Request = require '../Controller/Request'
Response = require '../Controller/Response'
Sync = require '../Util/Sync'

# Class for testing WaferPie applications outside the framework
# @constructor
# @param {string} applicationPath The path of your application
# @param {json} core Mocked core.json object
class Testing
    constructor: (@_applicationPath = './', @_core = {}, @_serverConfigs = {}) ->
        @_core.requestTimeout = @_core.requestTimeout ? 1000
        @_core.dataSources = @_core.dataSources ? {}
        @_serverConfigs.urlFormat = @_serverConfigs.urlFormat ? '/$application/$controller'
        @_controllers = {}
        # Loads all builtin components
        @_cherries = new Cherries
        @_components = {}
        @_filters = {}
        @_models = {}

        @_application =
            controllers: @_controllers
            components: @_components
            models: @_models
            filters: @_filters
            core: @_core

        @_applications = app: @_application

        # Necessary for testing Components and Models
        # When you are testing the Controllers, RequestHandler has its own ElementManager
        @_elementManager = new ElementManager @_application

        @_elementManager.inject = (name, type, instance) =>
            mockedProperties = @_application[type + 's']?[name]?.mocked ? {}
            for property of mockedProperties
                instance[property] = mockedProperties[property]

        @_filterFactory = new FilterFactory @_application
        @_filterFactory.inject = (instance) =>
            mockedProperties = @_filters?[instance.name]?.mocked ? {}
            for property of mockedProperties
                instance[property] = mockedProperties[property]

        @_builtinComponentsPath = path.resolve(path.join(__dirname, '..', 'Component', 'Builtin'))

        # Load Builtin components
        files = Sync.listFilesFromDir(@_builtinComponentsPath)
        for file in files
            @loadComponent(@_cherries.pathToElementName(file.substring(@_builtinComponentsPath.length + 1)))

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
        @loadModel modelName unless @_models[modelName]?
        @_elementManager.create('model', modelName, params)

    # Loads, creates, and returns the component instance or null if not found
    # @param {string} componentName The name of the component
    # @params {object} params Parameters that will be passed to the component constructor
    # @returns {object} The component instance or null
    createComponent: (componentName, params) ->
        @loadComponent componentName unless @_components[componentName]?
        @_elementManager.create('component', componentName, params)

    loadModel: (modelName) ->
        modelsPath = path.join(@_applicationPath, 'src', 'Model', @_cherries.elementNameToPath(modelName))
        allowedExtensions = ['coffee', 'js']
        for ext in allowedExtensions
            if @_exists(modelsPath + '.' + ext)
                @_models[modelName] = @_require(modelsPath)
                # Reset mocked properties
                @_models[modelName].mocked = @_models[modelName].autoMock ? null
                return true
        throw
        name: 'ModelNotFound'
        model: modelName
        searched: modelsPath


    loadFilter: (filterName) ->
        componentNameAsPath = @_cherries.elementNameToPath(filterName)
        filterPath = path.join(@_applicationPath, 'src', 'Filter', componentNameAsPath)

        allowedExtensions = ['coffee', 'js']
        for ext in allowedExtensions
            if @_exists(filterPath + '.' + ext)
                @_filters[filterName] = @_require(filterPath)
                # Reset mocked properties
                @_filters[filterName].mocked = @_filters[filterName].autoMock ? null
                return true

        throw
        name: 'FilterNotFound'
        component: filterName

    # Loads a component
    # You have to load all dependent components that you do not want to mock in your tests, including built-ins (QueryBuilder, etc)
    # @param {string} componentName The name of the component
    loadComponent: (componentName) ->
        componentNameAsPath = @_cherries.elementNameToPath(componentName)
        applicationComponentPath = path.join(@_applicationPath, 'src', 'Component', componentNameAsPath)
        builtinComponentPath = path.join(@_builtinComponentsPath, componentNameAsPath)

        allowedExtensions = ['coffee', 'js']
        for ext in allowedExtensions
            if @_exists(applicationComponentPath + '.' + ext)
                @_components[componentName] = @_require(applicationComponentPath)
                # Reset mocked properties
                @_components[componentName].mocked = @_components[componentName].autoMock ? null
                return true
            if @_exists(builtinComponentPath + '.' + ext)
                @_components[componentName] = @_require(builtinComponentPath)
                # Reset mocked properties
                @_components[componentName].mocked = @_components[componentName].autoMock ? null
                return true

        throw
        name: 'ComponentNotFound'
        component: componentName

    # Loads a model an then mocks its methods
    # @param {string} modelName The name of the model
    # @param {object} properties A JSON containing properties that will be injected into the model instance
    mockModel: (modelName, properties) ->
        @loadModel modelName unless @_models[modelName]?
        @_models[modelName].mocked = properties

    # Loads a component an then mocks its methods
    # @param {string} componentName The name of the component
    # @param {object} properties A JSON containing properties that will be injected into the component instance
    mockComponent: (componentName, properties) ->
        @loadComponent componentName unless @_components[componentName]?
        @_components[componentName].mocked = properties

    # Loads a filter an then mocks its properties
    # @param {string} filterName The name of the filter to be mocked
    # @param {object} properties A JSON containing properties that will be injected into the filter instance
    mockFilter: (filterName, properties) ->
        @loadFilter filterName unless @_filters[filterName]?
        @_filters[filterName].mocked = properties

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
            query: options.query
        )
        request = new Request
            url: url
            method: httpMethod
        request.receive = (callback) ->
            callback options.payload

        response = new Response
        response.send = (body = {}, headers = {}, statusCode = 200) ->
            setImmediate(->
                callback body,
                    headers: headers
                    statusCode: statusCode
            )

        monitoring =
            requests: 0
            responseAvg: 0

        requestHandler = new RequestHandler(@_applications, @_serverConfigs, null, monitoring)
        requestHandler._createFilterFactory = (application) => return @_filterFactory
        requestHandler._createElementManager = => return @_elementManager
        requestHandler.process request, response

module.exports = Testing
