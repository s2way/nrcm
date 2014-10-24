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
        headers['Content-Length'] = stringBody.length if stringBody.length > 0
        headers['Server'] = 'WaferPie'
        @_response.writeHead statusCode, headers
        @_response.end stringBody

    _convertOutput: (body, contentType) ->
        isJSON = contentType.indexOf('application/json') isnt -1
        isXML = contentType.indexOf('text/xml') isnt -1
        isUrlEncoded = contentType.indexOf('application/x-www-form-urlencoded') isnt -1
        return JSON.stringify(body) if isJSON
        return @_xml.fromJSON(body) if isXML
        return querystring.stringify(body) if isUrlEncoded
        return body

module.exports = Response