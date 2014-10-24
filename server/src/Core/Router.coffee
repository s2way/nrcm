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
    constructor: (urlFormat) ->
        @urlFormat = urlFormat
        @urlFormatParts = urlFormat.substring(1).split('/')

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
            return false
        parsedUrl = parsedUrl.substring(0, parsedUrl.length - 1)  if endsWithSlash
        if startsWithSlash
            return false
        urlNumParts = parsedUrl.substring(1).split('/').length
        requiredParts = @urlFormatParts.length
        requiredParts -= 1  if formatContainsApplication
        requiredParts -= 1  if formatContainsController
        if urlNumParts < requiredParts
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

    # Composes a request object into an URL (resource part only)
    compose: (requestObject) ->
        requestUrl = @urlFormat
        requestUrl = requestUrl.replace(/\$application/, requestObject.application)
        requestUrl = requestUrl.replace(/\$controller/, StringUtils.camelCaseToLowerCaseUnderscored(requestObject.controller).replace(/\./, '/'))

        prefixes = requestUrl.match(/\#[a-zA-Z0-9_-]*/g) ? {}

        for prefix in prefixes
            prefixWithoutSharp = prefix.substring(1)
            requestUrl = requestUrl.replace(new RegExp('\\' + prefix), requestObject.prefixes[prefixWithoutSharp])


        if Array.isArray requestObject.segments
            for segment in requestObject.segments
                requestUrl += '/' + segment

        requestUrl

    # It decomposes the url
    # @method decompose
    # @param {string} requestUrl The requested url received by the server
    # @return {object} Returns a splitted json object of the url
    decompose: (requestUrl) ->
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