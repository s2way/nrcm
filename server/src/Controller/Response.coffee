XML = require '../Component/Builtin/XML'
querystring = require 'querystring'

# Response
class Response

    constructor: (@_response) ->
        @_xml = new XML
        @_sent = false

    wasSent: -> @_sent

    send: (body = {}, headers = {}, statusCode = 200) ->
        @_sent = true
        contentType = headers['Content-Type'] ? 'application/json'
        stringBody = @_convertOutput body, contentType
        headers['Content-Type'] = contentType
        headers['Content-Length'] = (new Buffer(stringBody)).length if stringBody.length > 0
        headers['Server'] = 'WaferPie'
        @_response.writeHead statusCode, headers
        @_response.end stringBody

    writeHead: (headers = {}, statusCode = 200) ->
        contentType = headers['Content-Type'] ? 'application/json'
        headers['Content-Type'] = contentType
        headers['Server'] = 'WaferPie'
        @_response.writeHead statusCode, headers

    addTrailers: (trailers = {}) ->
        @_response.addTrailers trailers

    write: (body = '', callback) ->
        @_response.write body, callback

    end: (body = '') ->
        @_sent = true
        @_response.end body

    _convertOutput: (body, contentType) ->
        isJSON = contentType.indexOf('application/json') isnt -1
        isXML = contentType.indexOf('text/xml') isnt -1
        isUrlEncoded = contentType.indexOf('application/x-www-form-urlencoded') isnt -1
        return JSON.stringify(body) if isJSON
        return @_xml.fromJSON(body) if isXML
        return querystring.stringify(body) if isUrlEncoded
        return body

module.exports = Response