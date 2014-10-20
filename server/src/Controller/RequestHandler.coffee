querystring = require('querystring')
Exceptions = require('./../Util/Exceptions')
Router = require('./../Core/Router')
ElementFactory = require('./../Core/ElementFactory')
chalk = require('chalk')
XML = require('../Component/Builtin/XML')

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
    process: (request, response) ->
        $this = this
        @request = request
        @response = response
        @payload = ''
        requestUrl = @request.url
        @log chalk.bold.green('Request: ' + requestUrl)
        try
            router = new Router(@serverLogger, @configs.urlFormat)
            throw new Exceptions.InvalidUrl() unless router.isValid(requestUrl)
            decomposedURL = router.decompose(requestUrl)
            type = decomposedURL.type
            @method = @request.method.toLowerCase()
            @appName = decomposedURL.application
            if type isnt 'root'
                @application = (if @appName then @applications[@appName] else null)
                throw new Exceptions.ApplicationNotFound(@appName)  if @applications[@appName] is undefined
            @query = decomposedURL.query
            @prefixes = decomposedURL.prefixes
            @segments = decomposedURL.segments
            @log 'Application: ' + @appName
            @log 'Method: ' + @method
            @log 'URL type: ' + type
            @log 'Prefixes: ' + JSON.stringify(@prefixes)
            @log 'Query: ' + JSON.stringify(@query)
            if type is 'controller'
                controllerInfo = router.findController(@application.controllers, decomposedURL)
                controllerNameCamelCase = controllerInfo.controller
                @segments = controllerInfo.segments
                @log 'Segments: ' + JSON.stringify(@segments)
                @log 'Controller: ' + controllerNameCamelCase
                controllerInstance = @prepareController(controllerNameCamelCase)
                @invokeController controllerInstance, @method
            else if type is 'appRoot'
                @_receivePayload()
                @_endRequest ->
                    $this.render
                        application: $this.appName
                        version: $this.application.core.version
                    , 200

            else if type is 'root'
                @_receivePayload()
                @_endRequest ->
                    $this.render
                        version: $this.version
                    , 200

        catch e
            @handleRequestException e


    # Prepares the controller to be invoked
    # Controller dependency injection happens here
    # @return {object|boolean} The controller instance that should be passed to invokeController
    prepareController: (controllerName) ->
        $this = this
        application = @applications[@appName]
        throw new Exceptions.ControllerNotFound()  if controllerName is false or application.controllers[controllerName] is undefined
        @elementFactory = new ElementFactory(@serverLogger, application)
        @log 'Creating controller'
        ControllerConstructor = application.controllers[controllerName]
        controllerInstance = new ControllerConstructor()
        (injectProperties = ->
            retrieveComponentMethod = (componentName, params) ->
                instance = $this.elementFactory.create('component', componentName, params)
                $this.elementFactory.init instance
                instance

            retrieveModelMethod = (modelName, params) ->
                instance = $this.elementFactory.create('model', modelName, params)
                $this.elementFactory.init instance
                instance

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
            controllerInstance.application = $this.appName
            controllerInstance.core = application.core
            controllerInstance.configs = application.configs
            controllerInstance.component = retrieveComponentMethod
            controllerInstance.model = retrieveModelMethod
            controllerInstance.trace = automaticTraceImplementation
            controllerInstance.options = automaticOptionsImplementation
            controllerInstance.method = $this.method
            controllerInstance.head = controllerInstance.get
        )()
        controllerInstance

    _receivePayload: -> @request.on 'data', (data) => @payload += data

    _endRequest: (callback) -> @request.on 'end', callback

    # Return the request headers
    # This method is mocked in tests
    # @returns {object}
    # @private
    _headers: -> @request.headers

    # Set a response header
    # @param {string} name Header name
    # This method is mocked in tests
    # @param {string} value Header value
    # @private
    _setHeader: (name, value) -> @response.setHeader name, value

    _writeHead: (statusCode, contentType) ->
        headers = {}
        headers['content-type'] = contentType  if contentType
        @response.writeHead statusCode, headers

    _writeResponse: (output) -> @response.write output

    _sendResponse: -> @response.end()

    _parsePayload: (contentType, payload) ->
        return null if payload is null or payload is undefined or payload is ''
        isJSON = contentType.indexOf('application/json') isnt -1
        isXML = contentType.indexOf('text/xml') isnt -1
        isUrlEncoded = contentType.indexOf('application/x-www-form-urlencoded') isnt -1
        try
            if payload isnt ''
                return JSON.parse(payload) if isJSON
                return new XML().toJSON(payload) if isXML
                return querystring.parse(payload) if isUrlEncoded
                return payload
        catch e
            @log 'Error while parsing payload: ' + e
        null

    # It executes a function within the controller
    # @method invokeController
    # @param {string} controller The controller's name
    # @param {string} method The controller`s method that should be invoked
    invokeController: (controllerInstance, httpMethod, done) ->
        $this = this
        $this.log 'Invoking controller'
        savedOutput = null
        application = @applications[@appName]
        throw new Exceptions.MethodNotFound() if controllerInstance[httpMethod] is undefined
        $this.log 'Receiving payload'
        @_receivePayload()
        @_endRequest ->
            $this.log 'All data received'
            requestHeaders = $this._headers()
            requestContentType = requestHeaders['content-type'] or 'application/json'

            controllerInstance.payload = $this._parsePayload(requestContentType, $this.payload)
            controllerInstance.segments = $this.segments
            controllerInstance.query = $this.query
            controllerInstance.prefixes = $this.prefixes
            controllerInstance.requestHeaders = requestHeaders
            controllerInstance.responseHeaders = Server: 'WaferPie/' + $this.version

            timer = null
            afterCallback = ->
                clearTimeout timer
                try
                    controllerInstance.statusCode = 200  if controllerInstance.statusCode is undefined
                    (setHeaders = ->
                        if typeof controllerInstance.responseHeaders is 'object'
                            for name of controllerInstance.responseHeaders
                                if controllerInstance.responseHeaders.hasOwnProperty(name)
                                    value = controllerInstance.responseHeaders[name]
                                    $this._setHeader name, value
                    )()
                    $this.log 'Destroying components'
                    (destroyComponents = ->
                        componentsCreated = $this.elementFactory.getComponents()
                        destroyComponentInstance = ->
                            $this.log 'Destroying ' + componentName
                            componentInstance.destroy()

                        for componentName of componentsCreated
                            if componentsCreated.hasOwnProperty(componentName)
                                componentInstance = componentsCreated[componentName]
                                setImmediate destroyComponentInstance  if typeof componentInstance.destroy is 'function'
                    )()
                    $this.render savedOutput, controllerInstance.statusCode, controllerInstance.contentType
                    done?()
                catch e
                    $this.handleRequestException e

            controllerMethodCallback = (output) ->
                savedOutput = output
                try
                    (callAfterIfDefined = ->
                        if controllerInstance.after isnt undefined
                            controllerInstance.after afterCallback
                        else
                            afterCallback()
                    )()
                catch e
                    clearTimeout timer
                    $this.handleRequestException e

            beforeCallback = ->
                try

                # Call the controller method (put, get, delete, post, etc)
                    savedOutput = controllerInstance[httpMethod](controllerMethodCallback)
                catch e
                    clearTimeout timer
                    $this.handleRequestException e


            # Encapsulate the method in a immediate so it can be killed
            controllerMethodImmediate = setImmediate(->
                try
                    (callBefore = ->
                        if controllerInstance.before isnt undefined
                            controllerInstance.before beforeCallback
                        else
                            beforeCallback()
                    )()
                catch e

                # Catch exceptions that may occur in the controller before method
                    clearTimeout timer
                    $this.handleRequestException e
            )
            $this.log 'Timeout timer started'
            (startTimeoutTimer = ->
                timer = setTimeout(->
                    clearImmediate controllerMethodImmediate
                    $this.handleRequestException new Exceptions.Timeout()
                , application.core.requestTimeout)
            )()

    log: (message) -> @serverLogger.log '[RequestHandler] ' + message

    error: (message) -> @serverLogger.error '[RequestHandler] ' + message

    # It handles the exceptions
    # @method handleRequestException
    # @param {object} e The error
    handleRequestException: (e) ->
        @log 'Handling exception'
        knownException = e.name isnt undefined
        if knownException
            $this = this
            method = 'on' + e.name
            @log 'Creating ExceptionsController instance'
            instance = new @ExceptionsController()
            instance.statusCode = 200
            callback = (output) ->
                instance.statusCode = 200  if instance.statusCode is undefined
                $this.log 'Rendering exception'
                $this.render output, instance.statusCode

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
            if typeof output is 'object'
                isJSON = contentType.indexOf('application/json') isnt -1
                isXML = contentType.indexOf('text/xml') isnt -1
                if isJSON
                    @stringOutput = JSON.stringify(output)
                else if isXML
                    @stringOutput = new XML().fromJSON(output)
                else
                    @stringOutput = output
            else
                @stringOutput = output
            @_writeResponse @stringOutput
            @log 'Output: ' + chalk.cyan((if @stringOutput.length > 1000 then @stringOutput.substring(0, 1000) + '...' else @stringOutput))
            if statusCode >= 200 and statusCode < 300
                @log chalk.green('Response Status: ' + statusCode)
            else if statusCode >= 400 and statusCode < 500
                @log chalk.yellow('Response Status: ' + statusCode)
            else if statusCode >= 500
                @log chalk.red('Response Status: ' + statusCode)
            else
                @log chalk.blue('Response Status: ' + statusCode)
            @_sendResponse()
            @end = new Date()
            @log chalk.cyan('Time: ' + (@end.getTime() - @start.getTime()) + 'ms')

        @stringOutput

module.exports = RequestHandler