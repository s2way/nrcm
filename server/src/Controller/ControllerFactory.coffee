Exceptions = require '../Util/Exceptions'
ElementManager = require '../Core/ElementManager'

# Responsible for creating controllers and performing injection
class ControllerFactory

    constructor: (@_application, @_elementManager, @_logger = null) -> return

    _log: (message) ->
        @_logger?.log?('[ControllerFactory] ' + message)

    # Creates the controller with the given name
    # It will search within the application object passed to the constructor
    create: (controllerName) ->
        ControllerConstructor = @_application.controllers[controllerName]
        controllerInstance = new ControllerConstructor
        controllerInstance.elementManager = @_elementManager

        automaticTraceImplementation = (callback) ->
            controllerInstance.contentType = false
            for headerName of controllerInstance.requestHeaders
                if controllerInstance.requestHeaders.hasOwnProperty headerName
                    controllerInstance.responseHeaders[headerName] = controllerInstance.requestHeaders[headerName]
            callback ''

        automaticOptionsImplementation = (callback) ->
            methods = ['head', 'trace', 'options', 'get', 'post', 'put', 'delete']
            allowString = ''
            methods.forEach (method) ->
                if controllerInstance[method] isnt undefined
                    allowString += ','  if allowString isnt ''
                    allowString += method.toUpperCase()

            controllerInstance.responseHeaders.Allow = allowString
            controllerInstance.contentType = false
            callback ''

        controllerInstance.responseHeaders = {}
        controllerInstance.name = controllerName
        controllerInstance.application = @_application.name
        controllerInstance.core = @_application.core
        controllerInstance.configs = @_application.configs
        controllerInstance.uuid = @_application._uuid
        controllerInstance.limbo = @_application.limbo

        controllerInstance.component = (modelName, params) ->
            instance = controllerInstance.elementManager.create 'component', modelName, params
            controllerInstance.elementManager.init instance
            instance

        controllerInstance.model = (componentName, params) ->
            instance = controllerInstance.elementManager.create 'model', componentName, params
            controllerInstance.elementManager.init instance
            instance

        controllerInstance.trace = automaticTraceImplementation
        controllerInstance.options = automaticOptionsImplementation
        controllerInstance.head = (callback) ->
            controllerInstance.get callback

        controllerInstance

    # Performs additional injection
    # Executed after the method to be called is known and the payload has been received
    prepare: (instance, request) ->
        instance.segments = request.segments
        instance.query = request.decomposedURL.query
        instance.prefixes = request.decomposedURL.prefixes
        instance.method = request.method
        instance.url = request.url
        instance.payload = request.payload
        instance.requestHeaders = request.headers
        instance.responseHeaders = {}
        instance.params = {}

module.exports = ControllerFactory
