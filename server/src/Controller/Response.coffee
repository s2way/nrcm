XML = require '../Component/Builtin/XML'
querystring = require 'querystring'
chalk = require 'chalk'
_ = require 'underscore'

# Response
class Response

    constructor: (@_response, @_logger) ->
        @_xml = new XML
        @_sent = false
        @isResponding = false
        @isChunked = false
        @_bodySize = 0

    wasSent: ->
        @_sent

    send: (body = {}, headers = {}, statusCode = 200) ->
        @_sent = true
        contentType = headers['Content-Type'] ? 'application/json'
        stringBody = @_convertOutput body, contentType
        headers['Content-Type'] = contentType
        headers['Content-Length'] = (new Buffer(stringBody)).length if stringBody.length > 0
        headers['Server'] = 'WaferPie'
        @_response.writeHead statusCode, headers
        @_response.end stringBody

    writeHead: (statusCode = 200, headers = {}) ->
        @isChunked = true
        contentType = headers['Content-Type'] ? 'application/json'
        headers['Content-Type'] = contentType
        headers['Server'] = 'WaferPie'
        @_log "# Headers: "
        @_printHeaders (headers)
        @_response.writeHead statusCode, headers

    addTrailers: (trailers = {}) ->
        @_response.addTrailers trailers

    write: (body = '', callback) ->
        @isResponding = true
        @_log "# Chunk: #{chalk.cyan(body.substring(0,1000) + '...')}" if body? and _.isString body
        @_bodySize += if body.length > 0 then (new Buffer(body)).length else 0
        @_response.write body, callback

    end: () ->
        @_log "# Body size: #{@_bodySize}"
        @_log "#{chalk.blue('Connection ended')}"
        @_sent = true
        @_response.end()

    _convertOutput: (body, contentType) ->
        isJSON = contentType.indexOf('application/json') isnt -1
        isXML = contentType.indexOf('text/xml') isnt -1
        isUrlEncoded = contentType.indexOf('application/x-www-form-urlencoded') isnt -1
        return JSON.stringify(body) if isJSON
        return @_xml.fromJSON(body) if isXML
        return querystring.stringify(body) if isUrlEncoded
        return body

    _log: (message) ->
        @_logger.log "#{@uuid.substring(24)} #{message}" if message? and @_logger?

    _printHeaders: (headers) ->
        @_log "#{header}: #{headers[header]}" for header of headers

module.exports = Response