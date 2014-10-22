XML = require('../Component/Builtin/XML')

class Response

    constructor: (@_response) ->
        @_xml = new XML

    send: (body, headers, statusCode = 200, contentType = 'application/json', encoding = 'UTF-8') ->
        headers['Content-Length'] = body.length if body.length > 0
        headers['Content-Type'] = contentType if contentType
        headers['Server'] = 'WaferPie'
        @_response.writeHead statusCode, headers
        @_response.end body, encoding

    _convertOutput: (body, contentType) ->
        return body if typeof body isnt 'object'
        isJSON = contentType.indexOf('application/json') isnt -1
        isXML = contentType.indexOf('text/xml') isnt -1
        return JSON.stringify(body) if isJSON
        return @_xml.fromJSON(body) if isXML
        return body

module.exports = Response