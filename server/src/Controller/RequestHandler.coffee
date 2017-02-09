Exceptions = require './../Util/Exceptions'
Router = require './../Core/Router'
chalk = require 'chalk'
uuid = require 'node-uuid'
ControllerFactory = require './ControllerFactory'
FilterFactory = require './FilterFactory'
ControllerRunner = require './ControllerRunner'
ElementManager = require './../Core/ElementManager'

# Process an http request
# Decomposes the URL using the Router
# Instantiate and prepare the controller using the ControllerFactory
# Runs the controller by calling the ControllerRunner
# Handles any exception that can occur within the controller and the callbacks
# Renders the response by calling response.render()
class RequestHandler
    # Reference to the limbo object, where global variables can be stored
    limbo: null

    constructor: (@_applications, @_configs, @_serverLogger, @_monitoring, @_version) ->
        @_router = new Router @_configs.urlFormat
        @_controllerRunner = new ControllerRunner @_serverLogger

    # It processes every request received
    # @method process
    # @param {object} _request The request object that encapsulates a node request
    # @param {object} _response The response object that encapsulates a node response
    process: (@_request, @_response) ->
        @_uuid = uuid.v4()
        @_start = new Date()
        @_monitoring.requests += 1
        @_response.uuid = @_uuid
        try
            @_log chalk.bold.green('Request: ' + @_request.url)

            throw new Exceptions.InvalidUrl() unless @_router.isValid(@_request.url)

            @_request.decomposedURL = @_router.decompose(@_request.url)
            @_request.type = @_request.decomposedURL.type
            @_request.app = @_request.decomposedURL.application

            application = null

            if !@_request.isServerRoot()
                throw new Exceptions.ApplicationNotFound(@_request.app) if @_applications[@_request.app] is undefined
                application = (if @_request.app then @_applications[@_request.app] else null)
                application.uuid = application ? @_uuid
                application.limbo = @limbo

            @_log "Application: #{@_request.app} | Method: #{@_request.method.toUpperCase()} | URL Type: #{@_request.type}"
            @_log "Prefixes: #{JSON.stringify(@_request.decomposedURL.prefixes)}"
            @_log "Query String: #{JSON.stringify(@_request.decomposedURL.query)}"
            @_log "Headers: "
            @_printHeaders(@_request.headers)

            if @_request.isController()
                @_elementManager = @_createElementManager(application)
                @_controllerFactory = new ControllerFactory application, @_elementManager, @_serverLogger, @_response
                @_filterFactory = @_createFilterFactory(application)
                @_processControllerRequest(application)
            else if @_request.isApplicationRoot()
                @_processApplicationRoot(application)
            else if @_request.isServerRoot()
                @_processServerRoot()
        catch e
            @_handleRequestException e

    _printHeaders: (headers) ->
        @_log "# #{header}: #{headers[header]}" for header of headers

    _createElementManager: (application) ->
        return new ElementManager application

    _createFilterFactory: (application) ->
        return new FilterFactory application, @_elementManager, @_serverLogger

    # Process a normal controller request
    _processControllerRequest: (application) ->
        controllerInfo = @_router.findController(application.controllers, @_request.decomposedURL)

        throw new Exceptions.ControllerNotFound() if controllerInfo is false

        @_request.controller = controllerInfo.controller
        @_request.segments = controllerInfo.segments

        @_log "Segments: #{JSON.stringify(@_request.segments)}"
        @_log "Controller: #{@_request.controller}"

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


    # It receives the request payload
    # It prepares the controller for execution
    # It fires the ControllerRunner
    _invokeController: (instance) ->
        throw new Exceptions.MethodNotFound() if instance[@_request.method] is undefined

        @_request.receive (payload) =>
            @_log 'Payload: ' + JSON.stringify(payload)
            @_request.payload = payload

            @_controllerFactory.prepare instance, @_request
            @_filterFactory.createForController instance

            timeout = @_applications[@_request.app].core.requestTimeout

            @_controllerRunner.run instance, timeout, (error, response) =>
                @_elementManager.destroy (destroyError) =>
                    @_handleRequestException destroyError
                if error
                    @_handleRequestException error
                else
                    try
                        @_render response, instance.responseHeaders, instance.statusCode
                    catch e
                        @_handleRequestException e

    _log: (message) ->
        @_serverLogger?.log?(@_uuid.substring(24) + ' ' + message)

    _error: (message) ->
        @_serverLogger?.error?(@_uuid.substring(25) + ' ' + message)

    # It handles the exceptions
    # @method _handleRequestException
    # @param {object} e The error
    _handleRequestException: (e) ->
        knownException = e.name isnt undefined
        if knownException
            doNotPrintStackIf = ['ApplicationNotFound', 'ControllerNotFound', 'MethodNotFound']
            @_error 'Exception ' + e.name + ' handled'

            unless e.name in doNotPrintStackIf
                @_error ('\n' + e.stack) if e.stack isnt undefined

            @_render
                error: e.name
                message: e.message
            , {}, 500
        else
            @_error 'Unknown Exception: ' + e
            @_error ('\n' + e.stack) if e.stack isnt undefined
            @_render error: 'Unknown', {}, 500

    # The callback function that sends the response back to the client
    _render: (responseBody, responseHeaders, statusCode = 200) ->
        if @_response.wasSent()
            @_log 'Response already sent'
        else
            if typeof statusCode isnt 'number'
                throw new Exceptions.IllegalControllerParameter('Invalid statusCode: ' + statusCode)
            if typeof responseHeaders isnt 'object'
                throw new Exceptions.IllegalControllerParameter('Invalid responseHeaders: ' + responseHeaders)

            @_response.send responseBody, responseHeaders, statusCode

            responseBody = JSON.stringify(responseBody) if typeof responseBody is 'object'

            @_log chalk.bold(chalk.blue('Response'))
            # @_log "Body: #{chalk.cyan(responseBody.substring(0,1000) + '...')}"
            # @_log "Body: #{chalk.cyan(responseBody)}"
            @_log "Headers: "
            @_printHeaders (responseHeaders)

            color = 'blue'
            color = 'green' if 200 <= statusCode < 300
            color = 'yellow' if 400 <= statusCode < 500
            color = 'red' if statusCode >= 500

            @_log chalk[color]('Status Code: ' + statusCode)
            responseTimeInMs = new Date().getTime() - @_start.getTime()
            @_monitoring.responseAvg += responseTimeInMs
            @_monitoring.responseAvg /= @_monitoring.requests
            @_log "Time: #{responseTimeInMs}ms\n"

module.exports = RequestHandler
