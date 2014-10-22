Exceptions = require '../Util/Exceptions'
ElementManager = require '../Core/ElementManager'

# Responsible for creating controllers and performing injection
class ControllerFactory

    constructor: (@application, @logger = null) ->
        return

    log: (message) ->
        @logger?.log?('[ControllerFactory] ' + message)

    create: (controllerName) ->
        @log 'Creating controller'
        throw new Exceptions.ControllerNotFound() if controllerName is false or @application.controllers[controllerName] is undefined

        ControllerConstructor = @application.controllers[controllerName]
        controllerInstance = new ControllerConstructor()
        controllerInstance.elementManager = new ElementManager(@logger, @application)

        automaticTraceImplementation = (callback) =>
            controllerInstance.contentType = false
            for headerName of controllerInstance.requestHeaders
                if controllerInstance.requestHeaders.hasOwnProperty headerName
                    controllerInstance.responseHeaders[headerName] = controllerInstance.requestHeaders[headerName]
            callback ''

        automaticOptionsImplementation = (callback) =>
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
        controllerInstance.component = (modelName, params) =>
            instance = controllerInstance.elementFactory.create 'model', modelName, params
            controllerInstance.elementFactory.init instance
            instance

        controllerInstance.model = (componentName, params) =>
            instance = controllerInstance.elementFactory.create 'component', componentName, params
            controllerInstance.elementFactory.init instance
            instance

        controllerInstance.trace = automaticTraceImplementation
        controllerInstance.options = automaticOptionsImplementation
        controllerInstance.head = (callback) ->
            controllerInstance.get callback
        controllerInstance

    invoke: (instance, method, url) ->
        instance.method = method
        instance.url = url

    destroy: (instance) ->
        @log 'Destroying controller'
        componentsCreated = instance.elementFactory.getComponents()

        for componentInstance in componentsCreated
            destroyComponent = (componentInstance) =>
                @log 'Destroying ' + componentInstance.name
                componentInstance.destroy?()

            setImmediate destroyComponent, componentInstance

module.exports = ControllerFactory
