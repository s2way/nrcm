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
                    expect(body).to.be '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<root></root>'
                    done()
            response.send root: '',
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

