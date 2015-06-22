XML = require '../Component/Builtin/XML'
querystring = require 'querystring'
_ = require 'underscore'

#TODO: Migrate the headers instructions to the responseHandler
#TODO: Check if the headers were already sent
#TODO: Always use the same function to manage the headers

#TODO: Migrate the response errors to the responseHandler

#TODO: Split the functions end() and write() and expose them


#TODO: The response handler should receive the controller runner callback, that gonna continous the framework code
# after it has finished its job.


# Response
class Response

    constructor: (@_response) ->
        @_xml = new XML
        @_sent = false
        @_headers = {}
        @_trailers = {}
        @_headers['Server'] = 'WaferPie'
        @_headers['Content-Type'] = 'application/json'

    wasSent: -> @_sent

    setHeaders: (newHeaders) ->
        @_headers = _.extend(@_headers, newHeaders)

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
