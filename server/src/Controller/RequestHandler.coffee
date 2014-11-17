Exceptions = require './../Util/Exceptions'
Router = require './../Core/Router'
chalk = require 'chalk'
uuid = require 'node-uuid'
ControllerFactory = require './ControllerFactory'
ControllerRunner = require './ControllerRunner'
ElementManager = require './../Core/ElementManager'

# Process an http request
# Decomposes the URL using the Router
# Instantiate and prepare the controller using the ControllerFactory
# Runs the controller by calling the ControllerRunner
# Handles any exception that can occur within the controller and the callbacks
# Renders the response by calling response.render()
class RequestHandler
    constructor: (@_applications, @_configs, @_serverLogger, @_monitoring, @_version) ->
        @_uuid = uuid.v4()
        @_log 'RequestHandler created'
        @_router = new Router @_configs.urlFormat
        @_controllerRunner = new ControllerRunner

    # It processes every request received
    # @method process
    # @param {object} _request The request object that encapsulates a node request
    # @param {object} _response The response object that encapsulates a node response
    process: (@_request, @_response) ->
        @_start = new Date()
        @_monitoring.requests += 1
        try
            @_log chalk.bold.green('Request: ' + @_request.url)
            @_log chalk.blue 'UUID: ' + @_uuid

            throw new Exceptions.InvalidUrl() unless @_router.isValid(@_request.url)

            @_request.decomposedURL = @_router.decompose(@_request.url)
            @_request.type = @_request.decomposedURL.type
            @_request.app = @_request.decomposedURL.application

            application = null

            if !@_request.isServerRoot()
                throw new Exceptions.ApplicationNotFound(@_request.app) if @_applications[@_request.app] is undefined
                application = (if @_request.app then @_applications[@_request.app] else null)
                application.uuid = application ? @_uuid

            @_log 'Application: ' + @_request.app
            @_log 'Method: ' + @_request.method.toUpperCase()
            @_log 'URL type: ' + @_request.type
            @_log 'Prefixes: ' + JSON.stringify(@_request.decomposedURL.prefixes)
            @_log 'Query: ' + JSON.stringify(@_request.decomposedURL.query)

            if @_request.isController()
                @_elementManager = @_createElementManager(application)
                @_controllerFactory = new ControllerFactory application, @_elementManager, @_serverLogger
                @_processControllerRequest(application)
            else if @_request.isApplicationRoot()
                @_processApplicationRoot(application)
            else if @_request.isServerRoot()
                @_processServerRoot()
        catch e
            @_handleRequestException e

    _createElementManager: (application) ->
        return new ElementManager application, @_serverLogger

    # Process a normal controller request
    _processControllerRequest: (application) ->
        controllerInfo = @_router.findController(application.controllers, @_request.decomposedURL)

        throw new Exceptions.ControllerNotFound() if controllerInfo is false
        @_log 'Creating controller'

        @_request.controller = controllerInfo.controller
        @_request.segments = controllerInfo.segments

        @_log 'Segments: ' + JSON.stringify(@_request.segments)
        @_log 'Controller: ' + @_request.controller

        @_invokeController @_controllerFactory.create @_request.controller

    # Process the server root request and renders a response with the server version
    _processServerRoot: ->
        @_request.receive =>
            @_render version: @_version, {}, 200

    # Process the application root request and renders a response with the name and the version
    _processApplicationRoot: (application) ->
        @_request.receive =>
            @_render
                application: @_request.app
                version: application.core.version
            , {}, 200


    # It executes a function within the controller
    _invokeController: (instance) ->
        @_log 'Invoking controller'
        throw new Exceptions.MethodNotFound() if instance[@_request.method] is undefined
        @_log 'Receiving payload...'

        @_request.receive (payload) =>
            @_log 'Payload: ' + JSON.stringify(payload)
            @_request.payload = payload

            @_controllerFactory.prepare instance, @_request

            timeout = @_applications[@_request.app].core.requestTimeout

            @_controllerRunner.run instance, timeout, (error, response) =>
                @_elementManager.destroy
                if error
                    @_handleRequestException error
                else
                    @_render response, instance.responseHeaders, instance.statusCode

    _log: (message) ->
        @_serverLogger?.log?('[RequestHandler] ' + message)

    _error: (message) ->
        @_serverLogger?.error?('[RequestHandler] ' + message)

    # It handles the exceptions
    # @method _handleRequestException
    # @param {object} e The error
    _handleRequestException: (e) ->
        @_log 'Handling exception'
        knownException = e.name isnt undefined
        if knownException
            doNotPrintStackIf = ['ApplicationNotFound', 'ControllerNotFound', 'MethodNotFound']
            @_error 'Exception ' + e.name + ' handled'

            unless e.name in doNotPrintStackIf
                @_log e
                @_log e.stack if e.stack isnt undefined

            @_render
                error: e.name
                message: e.message
            , {}, 500
        else
            @_error 'Unknown Exception: ' + e
            @_error e.stack if e.stack isnt undefined
            @_render error: 'Unknown', {}, 500

    # The callback function that sends the response back to the client
    _render: (body, headers, statusCode = 200) ->
        if @_response.wasSent()
            @_log 'Response already sent'
        else
            @_log 'Rendering'

            if typeof statusCode isnt 'number'
                throw new Exceptions.IllegalControllerParameter('Invalid statusCode: ' + statusCode)
            if typeof headers isnt 'object'
                throw new Exceptions.IllegalControllerParameter('Invalid responseHeaders: ' + headers)

            @_response.send body, headers, statusCode

            body = JSON.stringify(body) if typeof body is 'object'

            @_log 'Output: ' + chalk.cyan((if body and body.length > 1000 then body.substring(0, 1000) + '...' else body))

            color = 'blue'
            color = 'green' if 200 <= statusCode < 300
            color = 'yellow' if 400 <= statusCode < 500
            color = 'red' if statusCode >= 500

            @_log chalk[color]('Response Status: ' + statusCode)
            responseTimeInMs = new Date().getTime() - @_start.getTime()
            @_monitoring.responseAvg += responseTimeInMs
            @_monitoring.responseAvg /= @_monitoring.requests
            @_log chalk.cyan('Time: ' + responseTimeInMs + 'ms')

module.exports = RequestHandler