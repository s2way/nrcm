XML = require '../Component/Builtin/XML'
querystring = require 'querystring'
_ = require 'underscore'

class Response

    constructor: (@_response) ->
        @_xml = new XML
        @_didSendHeaders = false
        @_didSendTrailers = false
        @_dataToSend = ''
        @encoding = 'utf8'
        @contentLength = 0
        @headers = {}
        @trailers = {}
        @body = {}
        @headers['Server'] = 'WaferPie'
        @headers['Content-Type'] = 'application/json'
        @statusCode = 200
        @isChunked = false

    _countLength: ->
        if Buffer.isBuffer @_dataToSend
            @contentLength += @_dataToSend.length
        else
            @contentLength += (new Buffer(@_dataToSend)).length

    _sendHeaders: ->
        @headers['Content-Length'] = @contentLength unless @isChunked
        @_response.writeHead @statusCode, @headers
        @_didSendHeaders = true

    _convertOutput: ->
        unless @isChunked
            switch @headers['Content-Type']
                when 'application/json' then @_dataToSend = JSON.stringify @body
                when 'text/xml' then @_dataToSend = @_xml.fromJSON @body
                when 'application/x-www-form-urlencoded' then @_dataToSend = querystring.stringify @body
                else @_dataToSend = @body
        else
            @_dataToSend = @body
        @_countLength()

    sendHeaders: ->
        return unless @isChunked # TODO: Log error (You can't manually sendHeaders in non-partial response)
        @_sendHeaders() unless @_didSendHeaders

    sendTrailers: ->
        #TODO: Check if the trailers were specified on the headers
        unless @_didSendTrailers
            return unless @isChunked # TODO: Log error here (No Trailers allowed in non-partial responses)
            @_response.addTrailers @trailers
            @_didSendTrailers = true

    writeChunk: (callback) ->
        #TODO: Log error here if is using without being Chunked
        @_convertOutput()
        @_response.write @_dataToSend, @encoding , callback

    finish: ->
        #TODO: Log error if it has data in last chunck
        @_convertOutput()
        @_sendHeaders() unless @isChunked
        @_response.end @_dataToSend, @encoding

module.exports = Response
