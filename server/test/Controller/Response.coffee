assert = require 'assert'
expect = require 'expect.js'
_ = require 'underscore'
XML = require './../../src/Component/Builtin/XML'
querystring = require 'querystring'
Response = require './../../src/Controller/Response'

describe 'Response', ->
    response = null

    afterEach 'should always contain the Server and Content-Type headers', ->
        expectedHeaderServer = 'WaferPie'
        expect(response.headers['Server']).to.eql expectedHeaderServer
        expect(response.headers['Content-Type']).to.be.ok()

    beforeEach ->
        response = null

    describe 'sendHeaders', ->

        it 'should send the headers if they were not sent already and the response is chunked', ->
            response = new Response(
                writeHead: ->
            )
            response.isChunked = true
            expect(response._didSendHeaders).not.to.be.ok()
            response.sendHeaders()
            expect(response._didSendHeaders).to.be.ok()

        it 'should not send the headers if they were already sent and the response is chunked', ->
            writeHeadCalledTimes = 0
            response = new Response(
                writeHead: ->
                    writeHeadCalledTimes += 1
            )
            response.isChunked = true
            expect(response._didSendHeaders).not.to.be.ok()
            response.sendHeaders()
            expect(response._didSendHeaders).to.be.ok()
            response.sendHeaders()
            expect(writeHeadCalledTimes).to.eql 1

        it 'should not send the headers if the response is not chunked', ->
            response = new Response(
                writeHead: ->
            )
            expect(response._didSendHeaders).not.to.be.ok()
            response.sendHeaders()
            expect(response._didSendHeaders).not.to.be.ok()

    describe 'sendTrailers', ->

        beforeEach ->
            response = new Response(
                addTrailers: ->
            )

        it 'should not send trailers if the response is not chunked', ->
            expect(response._didSendTrailers).not.to.be.ok()
            response.sendTrailers()
            expect(response._didSendTrailers).not.to.be.ok()

        it 'should send the trailers if they were not sent already, and the response is chunked', ->
            response.isChunked = true
            expect(response._didSendTrailers).not.to.be.ok()
            response.sendTrailers()
            expect(response._didSendTrailers).to.be.ok()

        it 'should not send the trailers if they were already sent', ->
            addTrailersCalledTimes = 0
            response = new Response(
                addTrailers: ->
                    addTrailersCalledTimes += 1
            )
            response.isChunked = true
            expect(response._didSendTrailers).not.to.be.ok()
            response.sendTrailers()
            expect(response._didSendTrailers).to.be.ok()
            response.sendTrailers()
            expect(addTrailersCalledTimes).to.eql 1

    describe 'writeChunk', ->

        it 'should write the requested body if the response is chunked', ->
            expectedResponse = 'testBody'
            receivedResponse = ''
            response = new Response(
                write: (chunk, encoding, callback) ->
                    receivedResponse = chunk
            )
            response.isChunked = true
            response.body = 'testBody'
            response.writeChunk ->
            expect(receivedResponse).to.eql expectedResponse

        it 'should add to the content-length if body is a buffer', ->
            passedContent = new Buffer('test')
            expectedSize = passedContent.length
            response = new Response(
                write: ->
            )
            response.isChunked = true
            response.body = passedContent
            response.writeChunk ->
            expect(response.contentLength).to.eql expectedSize

        it 'should add to the content-length if body is a string', ->
            passedContent = 'test'
            expectedSize = (new Buffer(passedContent)).length
            response = new Response(
                write: ->
            )
            response.isChunked = true
            response.body = passedContent
            response.writeChunk ->
            expect(response.contentLength).to.eql expectedSize

        it 'should have the correct content-length with special chars', ->
            passedContent = 'testé'
            expectedSize = (new Buffer(passedContent)).length
            response = new Response(
                write: ->
            )
            response.isChunked = true
            response.body = passedContent
            response.writeChunk ->
            expect(response.contentLength).to.eql expectedSize


        it 'should callback the passed function after writing if the response is chunked', ->
            callbackCalled = false
            response = new Response(
                write: (chunk, encoding, callback) ->
                    callback()
            )
            response.isChunked = true
            response.body = 'testBody'
            response.writeChunk () ->
                callbackCalled = true
            expect(callbackCalled).to.be.ok()

    describe 'finish()', ->

        it 'should response the raw data if is not chunked and there is not a convertable type', ->
            expectedResponse = 'testResponse'
            receivedResponse = null
            response = new Response(
                end: (data, encoding) ->
                    receivedResponse = data
                writeHead: ->
            )
            response.headers['Content-Type'] = 'another-thing'
            response.body = expectedResponse
            response.finish()
            expect(receivedResponse).to.eql expectedResponse

        it 'should response the JSON data if is not chunked and the content-type is application/json', ->
            expectedData = 'testResponse'
            expectedResponse = JSON.stringify expectedData
            receivedResponse = null
            response = new Response(
                end: (data, encoding) ->
                    receivedResponse = data
                writeHead: ->
            )
            response.headers['Content-Type'] = 'application/json'
            response.body = expectedData
            response.finish()
            expect(receivedResponse).to.eql expectedResponse

        it 'should response the JSON data if is not chunked and the content-type is text/xml', ->
            expectedData =
                'test' : 'testIt'
            expectedResponse = (new XML).fromJSON expectedData
            receivedResponse = null
            response = new Response(
                end: (data, encoding) ->
                    receivedResponse = data
                writeHead: ->
            )
            response.headers['Content-Type'] = 'text/xml'
            response.body = expectedData
            response.finish()
            expect(receivedResponse).to.eql expectedResponse

        it 'should response the JSON data if is not chunked and the content-type is application/x-www-form-urlencoded', ->
            expectedData = 'testResponse'
            expectedResponse = querystring.stringify expectedData
            receivedResponse = null
            response = new Response(
                end: (data, encoding) ->
                    receivedResponse = data
                writeHead: ->
            )
            response.headers['Content-Type'] = 'application/x-www-form-urlencoded'
            response.body = expectedData
            response.finish()
            expect(receivedResponse).to.eql expectedResponse
