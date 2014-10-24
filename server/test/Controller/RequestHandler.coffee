RequestHandler = require './../../src/Controller/RequestHandler'
Request = require './../../src/Controller/Request'
Response = require './../../src/Controller/Response'
Router = require './../../src/Core/Router'
expect = require 'expect.js'

describe 'RequestHandler', ->

    class MyController
        get: (callback) -> callback {}
        put: -> throw name: 'MyError', stack: new Error().stack
        delete: -> throw unknown: 'error', stack: new Error().stack

    class AnotherController
        get: (callback) ->
            @statusCode = 'invalid'
            callback {}
        put: (callback) ->
            @responseHeaders = 'invalid'
            callback {}

    applications =
        app:
            controllers:
                MyController: MyController
                AnotherController: AnotherController
            core:
                version: '1.0'
                requestTimeout: 10000
    logger =
        log: -> return
        info: -> return
        error: -> return
    configs =
        urlFormat: '/#prefix/$application/$controller'


    handler = null

    beforeEach ->
        handler = new RequestHandler applications, configs, logger

    describe 'process()', ->

        it 'should handle the MethodNotFound exception and render something', (done) ->
            request = new Request
                method: 'POST'
                url: 'http://localhost:3232/1/app/my_controller'
            response = new Response
            response.send = (body, headers, statusCode) ->
                expect(body.error).to.be 'MethodNotFound'
                expect(statusCode).to.be 500
                done()
            handler.process request, response

        it 'should handle the InvalidUrl exception and render something', (done) ->
            request = new Request
                method: 'GET'
                url: 'http://localhost:3232/1/app.extension'
            response = new Response
            response.send = (body, headers, statusCode) ->
                expect(statusCode).to.be 500
                expect(body.error).to.be 'InvalidUrl'
                done()
            handler.process request, response

        it 'should handle the ApplicationNotFound exception and render something', (done) ->
            request = new Request
                method: 'GET'
                url: 'http://localhost:3232/1/wrong'
            response = new Response
            response.send = (body, headers, statusCode) ->
                expect(statusCode).to.be 500
                expect(body.error).to.be 'ApplicationNotFound'
                done()
            handler.process request, response

        it 'should handle the ControllerNotFound exception and render something', (done) ->
            request = new Request
                method: 'GET'
                url: 'http://localhost:3232/1/app/invalid'
            response = new Response
            response.send = (body, headers, statusCode) ->
                expect(statusCode).to.be 500
                expect(body.error).to.be 'ControllerNotFound'
                done()
            handler.process request, response


        it 'should handle the IllegalControllerParameter exception if the controller.statusCode is not a string and render the exception', (done) ->
            request = new Request
                method: 'GET'
                url: 'http://localhost:3232/1/app/another_controller'
            request.receive = (callback) -> callback ''
            response = new Response
            response.send = (body, headers, statusCode) ->
                expect(statusCode).to.be 500
                expect(body.error).to.be 'IllegalControllerParameter'
                expect(body.message).to.be 'Invalid statusCode: invalid'
                done()
            handler.process request, response

        it 'should handle the IllegalControllerParameter exception if the controller.responseHeaders is not a string and render the exception', (done) ->
            request = new Request
                method: 'PUT'
                url: 'http://localhost:3232/1/app/another_controller'
            request.receive = (callback) -> callback ''
            response = new Response
            response.send = (body, headers, statusCode) ->
                expect(statusCode).to.be 500
                expect(body.error).to.be 'IllegalControllerParameter'
                expect(body.message).to.be 'Invalid responseHeaders: invalid'
                done()
            handler.process request, response

        it 'should invoke the controller and render if the url is valid', (done) ->
            request = new Request
                method: 'GET'
                url: 'http://localhost:3232/1/app/my_controller'
            request.receive = (callback) ->
                callback ''
            response = new Response
            response.send = (body, headers, statusCode) ->
                expect(headers).to.be.ok()
                expect(statusCode).to.be 200
                expect(body).to.be.ok()
                expect(body.error).not.to.be.ok()
                done()
            handler.process request, response

        it 'should render a JSON with the application version when the application root is queried', (done) ->
            request = new Request
                method: 'GET'
                url: 'http://localhost:3232/1/app'
            request.receive = (callback) ->
                callback ''
            response = new Response
            response.send = (body) ->
                expect(body.version).to.be '1.0'
                expect(body.application).to.be 'app'
                done()
            handler.process request, response

        it 'should render a JSON with the NRCM version when the root is queried', (done) ->
            request = new Request
                method: 'GET'
                url: 'http://localhost:3232/1'
            request.receive = (callback) ->
                callback ''
            response = new Response
            response.send = (body) ->
                expect(body.version).to.be '0.8.4'
                done()
            handler.process request, response

        it 'should render any known exceptions (with name) that occur within the controller', (done) ->
            request = new Request
                method: 'PUT'
                url: 'http://localhost:3232/1/app/my_controller'
            request.receive = (callback) ->
                callback ''
            response = new Response
            response.send = (body) ->
                expect(body.error).to.be 'MyError'
                done()
            handler.process request, response

        it 'should render any unknown exceptions (without name) that occur within the controller', (done) ->
            request = new Request
                method: 'DELETE'
                url: 'http://localhost:3232/1/app/my_controller'
            request.receive = (callback) ->
                callback ''
            response = new Response
            response.send = (body) ->
                expect(body.error).to.be 'Unknown'
                done()
            handler.process request, response





