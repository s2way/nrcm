Exceptions = require '../Util/Exceptions'
ElementManager = require '../Core/ElementManager'

# Responsible for creating controllers, performing injection and destroy them
class ControllerFactory

    constructor: (@application, @logger = null) ->
        return

    _log: (message) ->
        @logger?.log?('[ControllerFactory] ' + message)

    # Creates the controller with the given name
    # It will search within the application object passed to the constructor
    create: (controllerName) ->
        ControllerConstructor = @application.controllers[controllerName]
        controllerInstance = new ControllerConstructor
        controllerInstance.elementManager = new ElementManager @logger, @application

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
        controllerInstance.application = @application.name
        controllerInstance.core = @application.core
        controllerInstance.configs = @application.configs
        controllerInstance.uuid = @application._uuid
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

    # Destroy the controller instance and all loaded components
    # The destruction of the components is asynchronous
    destroy: (instance) ->
        @_log 'Destroying controller'
        componentsCreated = instance.elementManager.getComponents()

        for componentInstance in componentsCreated
            destroyComponent = (componentInstance) =>
                @_log 'Destroying ' + componentInstance.name
                componentInstance.destroy?()

            setImmediate destroyComponent, componentInstance

module.exports = ControllerFactory
