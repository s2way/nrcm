url = require 'url'
path = require 'path'
StringUtils = require './../Component/Builtin/StringUtils'

# This class verifies if an url was passed in the format configured,
# it also creates an json object to make the reading easier
#
# Format example: /#prefix1/#prefix2/$application/$controller
# The router object

class Router

    # @constructor
    # @method Router
    # @param {string} urlFormat The string that represents how you will send the urls to the server,
    # check the example above
    constructor: (logger, urlFormat) ->
        @logger = logger
        @urlFormat = urlFormat
        @urlFormatParts = urlFormat.substring(1).split('/')
        @info 'Router created'

    info: (msg) -> @logger.info '[Router] ' + msg

    # It checks if the url received by the server was formatted according to the configuration
    # @method isValid
    # @param {string} requestUrl The requested url received by the server
    # @return {boolean} Returns true if succeed or false if failed
    isValid: (requestUrl) ->
        parsedUrl = url.parse(requestUrl, true).pathname
        startsWithSlash = parsedUrl.charAt(0) isnt '/'
        endsWithSlash = parsedUrl.charAt(parsedUrl.length - 1) is '/'
        noExtension = path.extname(parsedUrl) isnt ''
        formatContainsApplication = @urlFormat.indexOf('$application') isnt -1
        formatContainsController = @urlFormat.indexOf('$controller') isnt -1
        if noExtension
            @info 'Extension is not allowed'
            return false
        parsedUrl = parsedUrl.substring(0, parsedUrl.length - 1)  if endsWithSlash
        if startsWithSlash
            @info 'URL does not start with /'
            return false
        urlNumParts = parsedUrl.substring(1).split('/').length
        requiredParts = @urlFormatParts.length
        requiredParts -= 1  if formatContainsApplication
        requiredParts -= 1  if formatContainsController
        if urlNumParts < requiredParts
            @info 'URL parts do not match the specified format'
            return false
        true

    # Try to find a matching controller for the given decomposed url in the controllers list
    # @param {object} controllers List of controllers loaded by the application
    # @param {object} decomposedUrl Decomposed URL returned by Router.decompose()
    # @return {string|boolean} The matching controller and its segments or false if none is found
    findController: (controllers, decomposedUrl) ->
        controllersArray = []
        for controllerName of decomposedUrl.controllers
            controllersArray.push controllerName  if decomposedUrl.controllers.hasOwnProperty(controllerName)
        controllersArrayReverted = controllersArray.reverse()
        for i of controllersArrayReverted
            if controllersArrayReverted.hasOwnProperty(i)
                controllerName = controllersArrayReverted[i]
                controllerNameCamelCase = StringUtils.lowerCaseUnderscoredToCamelCase(controllerName.replace(/\//g, '.'))
                if controllers[controllerNameCamelCase] isnt undefined
                    return (
                        controller: controllerNameCamelCase
                        segments: decomposedUrl.controllers[controllerName].segments
                    )
        false

    # It decomposes the url
    # @method decompose
    # @param {string} requestUrl The requested url received by the server
    # @return {object} Returns a splitted json object of the url
    decompose: (requestUrl) ->
        @info 'Decomposing URL'
        parsedUrl = url.parse(requestUrl, true)
        parts = parsedUrl.pathname.substring(1).split('/')
        prefixes = {}
        controllers = {}
        controllerAppended = ''
        application = 'app'
        type = 'root'
        i = 0
        $this = this
        parts.forEach (part) ->
            if part
                urlFormatPart = $this.urlFormatParts[i]
                if urlFormatPart isnt undefined
                    formatPartFirstChar = urlFormatPart.charAt(0)
                    if formatPartFirstChar is '#'
                        prefixes[urlFormatPart.substring(1)] = part
                    else if urlFormatPart is '$controller'
                        type = 'controller'
                        controllers[part] = segments: parts.slice(i + 1)
                        controllerAppended = part
                    else if urlFormatPart is '$application'
                        type = 'appRoot'  if type is 'root'
                        application = part
                else
                    controllerAppended += '/' + part
                    controllers[controllerAppended] = segments: parts.slice(i + 1)
            i += 1
            return

        @info 'URL decomposed'
        host: parsedUrl.host
        hostname: parsedUrl.hostname
        port: parsedUrl.port
        protocol: parsedUrl.protocol
        url: requestUrl
        type: type
        controllers: controllers
        application: application
        prefixes: prefixes
        query: parsedUrl.query

module.exports = Router