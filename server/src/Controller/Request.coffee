querystring = require('querystring')
XML = require('../Component/Builtin/XML')

class Request

    constructor: (@_request, @_logger = null) ->
        @method = @_request.method.toLowerCase()
        @url = @_request.url
        @headers = @_request.headers
        @_xml = new XML()

    receive: (callback) ->
        payload = ''
        @_request.on 'data', (data) ->
            payload += data

        @_request.on 'end', =>
            @payload = @_parsePayload(payload)
            callback(@payload)

    isController: -> return @type is 'controller'
    isServerRoot: -> return @type is 'root'
    isApplicationRoot: -> return @type is 'appRoot'

    _log: (message) ->
        @_logger?.log?('[Request] ' + message)

    _parsePayload: (payload) ->
        contentType = @headers?['content-type'] ? 'application/json'
        return null if payload is null or payload is undefined or payload is ''
        isJSON = contentType.indexOf('application/json') isnt -1
        isXML = contentType.indexOf('text/xml') isnt -1
        isUrlEncoded = contentType.indexOf('application/x-www-form-urlencoded') isnt -1
        try
            return JSON.parse(payload) if isJSON
            return @_xml.toJSON(payload) if isXML
            return querystring.parse(payload) if isUrlEncoded
            return payload
        catch e
            @_log 'Error while parsing payload: ' + e
        null

module.exports = Request
