Exceptions = require('./../Util/Exceptions')
Router = require('./../Core/Router')
chalk = require('chalk')
ControllerFactory = require './ControllerFactory'

# The request handler object
# @constructor
# @method RequestHandler
# @param {json} configs
# @param {json} applications
# @param {object} ExceptionsController
class RequestHandler
    constructor: (serverLogger, configs, applications, ExceptionsController, version) ->
        @applications = applications
        @configs = configs
        @ExceptionsController = ExceptionsController
        @start = new Date()
        @serverLogger = serverLogger
        @version = version
        @log 'RequestHandler created'

    # It processes every request received
    # @method process
    # @param {object} request The NodeJS request object
    # @param {object} response The NodeJS response object
    process: (@_request, @response) ->
        self = this

        requestUrl = @_request.url
        @log chalk.bold.green('Request: ' + requestUrl)
        try
            router = new Router(@serverLogger, @configs.urlFormat)
            throw new Exceptions.InvalidUrl() unless router.isValid(requestUrl)
            @decomposedURL = router.decompose(requestUrl)
            type = @decomposedURL.type
            @method = @_request.method
            @appName = @decomposedURL.application

            if type isnt 'root'
                @application = (if @appName then @applications[@appName] else null)
                throw new Exceptions.ApplicationNotFound(@appName)  if @applications[@appName] is undefined

            @log 'Application: ' + @appName
            @log 'Method: ' + @method
            @log 'URL type: ' + type
            @log 'Prefixes: ' + JSON.stringify(@decomposedUrl.prefixes)
            @log 'Query: ' + JSON.stringify(@decomposedUrl.query)

            if type is 'controller'
                @_controllerFactory = new ControllerFactory @applications[@appName], @serverLogger
                controllerInfo = router.findController(@application.controllers, @decomposedURL)
                controllerNameCamelCase = controllerInfo.controller
                @segments = controllerInfo.segments
                @log 'Segments: ' + JSON.stringify(controllerInfo.segments)
                @log 'Controller: ' + controllerNameCamelCase
                controllerInstance = @prepareController(controllerNameCamelCase)
                @invokeController controllerInstance, @method
            else if type is 'appRoot'
                @request.receive ->
                    self.render
                        application: self.appName
                        version: self.application.core.version
                    , 200

            else if type is 'root'
                @request.receive ->
                    self.render
                        version: self.version
                    , 200

        catch e
            @handleRequestException e


    # Prepares the controller to be invoked
    # Controller dependency injection happens here
    # @return {object|boolean} The controller instance that should be passed to invokeController
    prepareController: (controllerName) ->
        @_controllerFactory.create(controllerName, @method, @decomposedUrl)

    _startTimeout: ->
        @log 'Timeout timer started'
        @_timeoutTimer = setTimeout(=>
            clearImmediate @_controllerMethodImmediate
            @handleRequestException new Exceptions.Timeout()
        , @applications[@appName].core.requestTimeout)

    # It executes a function within the controller
    # @method invokeController
    # @param {string} controller The controller's name
    # @param {string} method The controller`s method that should be invoked
    invokeController: (controllerInstance, httpMethod, done) ->
        self = this
        self.log 'Invoking controller'
        savedOutput = null
        throw new Exceptions.MethodNotFound() if controllerInstance[httpMethod] is undefined
        self.log 'Receiving payload'

        @_controllerFactory.prepare controllerInstance, httpMethod, @decomposedUrl, @segments

        @_request.receive (payload) =>
            self.log 'All data received'

            controllerInstance.payload = payload
            controllerInstance.requestHeaders = @request.headers

            @_controllerFactory.invoke @_request.headers, payload

            controllerInstance.responseHeaders = {}

            self._timeoutTimer= null
            self._afterCallback = ->
                clearTimeout self._timeoutTimer
                try
                    controllerInstance.statusCode = 200 if !controllerInstance.statusCode
                    # Set Headers
                    if typeof controllerInstance.responseHeaders is 'object'
                        for name of controllerInstance.responseHeaders
                            if controllerInstance.responseHeaders.hasOwnProperty(name)
                                value = controllerInstance.responseHeaders[name]
                                self._setHeader name, value

                    # Destroy components
                    @_controllerFactory.destroy()
                    self.render savedOutput, controllerInstance.statusCode, controllerInstance.contentType
                    done?()
                catch e
                    self.handleRequestException e

            controllerMethodCallback = (output) ->
                savedOutput = output
                try
                    # callAfterIfDefined
                    if controllerInstance.after isnt undefined
                        controllerInstance.after self._afterCallback
                    else
                        self._afterCallback()
                catch e
                    clearTimeout self._timeoutTimer
                    self.handleRequestException e

            beforeCallback = () ->
                try
                    # Call the controller method (put, get, delete, post, etc)
                    savedOutput = controllerInstance[httpMethod](controllerMethodCallback)
                catch e
                    clearTimeout self._timeoutTimer
                    self.handleRequestException e


            # Encapsulate the method in a immediate so it can be killed
            self._controllerMethodImmediate = setImmediate(->
                try
                    # callBefore
                    if controllerInstance.before isnt undefined
                        controllerInstance.before beforeCallback
                    else
                        beforeCallback()
                catch e
                    # Catch exceptions that may occur in the controller before method
                    clearTimeout self._timeoutTimer
                    self.handleRequestException e
            )
            self._startTimeout()

    log: (message) -> @serverLogger.log '[RequestHandler] ' + message

    error: (message) -> @serverLogger.error '[RequestHandler] ' + message

    # It handles the exceptions
    # @method handleRequestException
    # @param {object} e The error
    handleRequestException: (e) ->
        @log 'Handling exception'
        knownException = e.name isnt undefined
        if knownException
            self = this
            method = 'on' + e.name
            @log 'Creating ExceptionsController instance'
            instance = new @ExceptionsController()
            instance.statusCode = 200
            callback = (output) ->
                instance.statusCode = 200  if instance.statusCode is undefined
                self.log 'Rendering exception'
                self.render output, instance.statusCode

            if typeof instance[method] is 'function'
                instance[method] callback
            else if instance.onGeneral isnt undefined
                instance.onGeneral callback, e
            else
                @log e
                @log e.stack if e.stack isnt undefined
                return
            @error 'Exception ' + e.name + ' handled'
        else
            @error 'Unknown Exception: ' + e
            @error e.stack if e.stack isnt undefined

    # The callback function that sends the response back to the client
    # @method render
    # @param {object=} output The body/payload data
    # @param {number=} statusCode The status code for http response
    # @param {string|boolean=} contentType The text for the Content-Type http header
    render: (output = {}, statusCode = 200, contentType = 'application/json') ->
        if @method is 'head'
            output = ''
            contentType = false

        if @stringOutput is undefined
            @log 'Rendering'
            @log 'content-type: ' + contentType


            @_writeHead statusCode, contentType

            @_sendResponse @stringOutput
            @_response.send @stringOutput, headers, contentType, statusCode

            @log 'Output: ' + chalk.cyan((if @stringOutput.length > 1000 then @stringOutput.substring(0, 1000) + '...' else @stringOutput))
            if statusCode >= 200 and statusCode < 300
                @log chalk.green('Response Status: ' + statusCode)
            else if statusCode >= 400 and statusCode < 500
                @log chalk.yellow('Response Status: ' + statusCode)
            else if statusCode >= 500
                @log chalk.red('Response Status: ' + statusCode)
            else
                @log chalk.blue('Response Status: ' + statusCode)

            @end = new Date()
            @log chalk.cyan('Time: ' + (@end.getTime() - @start.getTime()) + 'ms')

        @stringOutput

module.exports = RequestHandler