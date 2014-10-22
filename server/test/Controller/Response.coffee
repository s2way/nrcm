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
                end: (body, encoding) ->
                    expect(writeHeadCalled).to.be true
                    expect(body).to.be '{}'
                    expect(encoding).to.be 'UTF-8'
                    done()
            )
            response.send {}, {}, 200, 'application/json', 'UTF-8'

        it 'should convert the body to a XML if the Content-Type is text/xml', (done) ->
            response = new Response
                writeHead: -> return
                end: (body) ->
                    expect(body).to.be ''
                    done()
            response.send root: '', {}, 'text/xml'

        it 'should convert the body to an encoded url if the Content-Type is application/www-x-form-urlencoded', (done) ->
            response = new Response
                writeHead: -> return
                end: (body) ->
                    expect(body).to.be 'this=is&the=body'
                    done()
            response.send this: 'is', the: 'body', {}, 'application/www-x-form-urlencoded'


