assert = require 'assert'
expect = require 'expect.js'
Response = require './../../src/Controller/Response'

describe 'Response', ->

    describe 'send()', ->

        it 'should call writeHead() and end()', (done) ->
            writeHeadCalled = false
            response = new Response(
                writeHead: (statusCode, headers) ->
                    writeHeadCalled = true
                    expect(statusCode).to.be 200
                    expect(headers['Content-Length']).to.be 2
                    expect(headers['Content-Type']).to.be 'application/json'
                    expect(headers['Server']).to.be 'WaferPie'
                end: (body) ->
                    expect(writeHeadCalled).to.be true
                    expect(body).to.be '{}'
                    done()
            )
            response.send {}, {
                'Content-Type': 'application/json'
            }, 200

        it 'should count correctly the number of bytes of the response if there are special chars', (done) ->
            response = new Response(
                writeHead: (statusCode, headers) ->
                    expect(statusCode).to.be 200
                    expect(headers['Content-Length']).to.be 6
                    expect(headers['Content-Type']).to.be 'text/plain'
                    done()
                end: ->
            )
            response.send 'André', {
                'Content-Type': 'text/plain'
            }, 200

        it 'should convert the body to a XML if the Content-Type is text/xml', (done) ->
            response = new Response
                writeHead: -> return
                end: (body) ->
                    expect(body).to.be '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<root>?</root>'
                    done()
            response.send root: '?',
                'Content-Type' : 'text/xml'
            , 200

        it 'should convert the body to an encoded url if the Content-Type is application/x-www-form-urlencoded', (done) ->
            response = new Response
                writeHead: -> return
                end: (body) ->
                    expect(body).to.be 'this=is&the=body'
                    done()
            response.send this: 'is', the: 'body',
                'Content-Type' : 'application/x-www-form-urlencoded'
            , 200

        it 'should return the body as text if the Content-Type is text/plain', (done) ->
            response = new Response
                writeHead: -> return
                end: (body) ->
                    expect(body).to.be 'this is a textual body'
                    done()
            response.send 'this is a textual body',
                'Content-Type' : 'text/plain'
            , 200

    describe 'wasSent()', ->

        it 'should return true after send() is called', ->
            response = new Response
                writeHead: -> return
                end: -> return
            response.send()
            expect(response.wasSent()).to.be true

        it 'should return false before send() is called', ->
            response = new Response
                writeHead: -> return
                end: -> return
            expect(response.wasSent()).to.be false

    describe 'writeHead()', ->

        it 'should write the specified headers to the response, with the desired statuscode', (done) ->

            expectedHeaders = {}
            expectedHeaders['Content-Type'] = 'application/json'
            expectedHeaders['Server'] = 'WaferPie'
            expectedStatusCode = 200

            response = new Response
                writeHead: (statusCode, headers) ->
                    expect(statusCode).to.eql expectedStatusCode
                    expect(JSON.stringify(headers)).to.eql JSON.stringify(expectedHeaders)
                    done()
            response.writeHead()

    describe 'addTrailers()', ->

        it 'should add the passed headers to the response trailing headers', (done) ->

            expectedTrailers = {}
            expectedTrailers['Content-MD5'] = 'abcdefg123456'

            passedTrailers = expectedTrailers

            response = new Response
                addTrailers: (trailers) ->
                    expect(JSON.stringify(trailers)).to.eql JSON.stringify expectedTrailers
                    done()

            response.addTrailers passedTrailers

        it 'should add no trailers if none are passed', (done) ->

            expectedTrailers = {}
            response = new Response
                addTrailers: (trailers) ->
                    expect(JSON.stringify(trailers)).to.eql JSON.stringify expectedTrailers
                    done()

            response.addTrailers()


    describe 'write()', ->


        it 'should write the specified chunk to the response', (done) ->
            
            passedBody = 'string'
            expectedBody = passedBody

            response = new Response
                write: (body, callback)->
                    expect(body).to.eql expectedBody
                    callback()
                    done()

            response.write passedBody, ->

        it 'should callback after finishing writing', (done) ->

            callbackCalled = false

            callback = () ->
                callbackCalled = true

            response = new Response
                write: (body, callback) ->
                    callback()

            response.write '', callback
            expect(callbackCalled).to.be.ok()
            done()

        it 'should default to an empty body', (done) ->

            expectedBody = ''

            response = new Response
                write: (body, callback)->
                    expect(body).to.eql expectedBody
                    callback()
                    done()

            response.write null, ->

    describe 'end()', ->

        it 'should set _sent to true', (done) ->

            response = new Response
                end: ->

            response.end()
            expect(response._sent).to.be.ok()
            done()

        it 'should call _response end with the passed body', (done) ->

            passedBody = 'string'
            expectedBody = passedBody

            response = new Response
                end: (body) ->
                    expect(body).to.eql expectedBody
                    done()
            response.end passedBody