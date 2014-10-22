XML = require('../Component/Builtin/XML')

class Response

    constructor: (@_response) ->
        @_xml = new XML
        return

    send: (body, headers, contentType = 'application/json', statusCode = 200, encoding = 'UTF-8') ->


        headers['Content-Length'] = body.length
        headers['Content-Type'] = contentType
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
