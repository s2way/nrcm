ControllerRunner = require './../../src/Controller/ControllerRunner'
Router = require './../../src/Core/Router'
expect = require 'expect.js'

describe 'ControllerRunner', ->

    describe 'run()', ->

        logger =
            log: -> return
        runner = null

        beforeEach ->
            runner = new ControllerRunner logger

        it 'should call the before() callback if is defined', (done) ->
            instance =
                filters: []
                method: 'get'
                before: ->
                    done()
            runner.run instance, 1000, ->
                expect.fail()

        it 'should call the after() callback if it is defined', (done) ->
            instance =
                filters: []
                method: 'get'
                get: (callback) ->
                    callback {}
                after: ->
                    done()
            runner.run instance, 1000, ->
                expect.fail()

        it 'should call the get() method if the instance has the method property defined as "get"', (done) ->
            instance =
                filters: []
                method: 'get'
                get: ->
                    done()
            runner.run instance, 1000, ->
                expect.fail()

        it 'should call the callback passing a Timeout exception if the timeout has occured', (done) ->
            instance =
                filters: []
                method: 'get'
                get: ->
            runner.run instance, 1, (e) ->
                expect(e.name).to.be 'Timeout'
                done()


        it 'should call the callback passing the error if an exception occurs in the after() method', (done) ->
            afterError = {}
            instance =
                filters: []
                method: 'get'
                get: (callback) ->
                    callback {}
                after: ->
                    throw afterError
            runner.run instance, 10000, (e) ->
                expect(e).to.be afterError
                done()

        it 'should call the callback passing the error if an exception occurs in the before() method', (done) ->
            beforeError = {}
            instance =
                filters: []
                before: ->
                    throw beforeError
            runner.run instance, 10000, (e) ->
                expect(e).to.be beforeError
                done()

        it 'should call the callback passing the error if an exception occurs in the get() method', (done) ->
            getError = {}
            instance =
                filters: []
                method: 'get'
                get: -> throw getError
            runner.run instance, 10000, (e) ->
                expect(e).to.be getError
                done()

        it 'should call before(), get(), after() and pass the response to the callback', (done) ->
            instance =
                filters: []
                method: 'get'
                before: (callback) -> callback true
                get: (callback) -> callback {}
                after: (callback) -> callback true
            runner.run instance, 10000, (error, response) ->
                expect(error).not.to.be.ok()
                expect(response).to.be.ok()
                done()

        it 'should call get() and pass the response to the callback', (done) ->
            instance =
                filters: []
                method: 'get'
                get: (callback) -> callback {}
            runner.run instance, 10000, (error, response) ->
                expect(error).not.to.be.ok()
                expect(response).to.be.ok()
                done()

        it 'should not call get() and after() if an exception occurs inside before()', (done) ->
            failed = false
            instance =
                filters: []
                method: 'get'
                before: ->
                    throw {}
                get: (callback) ->
                    failed = true
                    callback({})
                after: (callback) ->
                    failed = true
                    callback()
            runner.run instance, 10000, ->
                expect(failed).to.be false
                done()

        it 'should not call after() if an exception occurs inside get()', (done) ->
            failed = false
            instance =
                filters: []
                method: 'get'
                get: ->
                    throw {}
                after: (callback) ->
                    failed = true
                    callback()
            runner.run instance, 10000, ->
                expect(failed).to.be false
                done()

        it 'should answer if the object passed to the before() method is an object', (done) ->
            instance =
                filters: []
                method: 'get'
                before: (callback) -> callback (before: true)
                get: -> throw {}
            runner.run instance, 10000, (error, response) ->
                expect(error).not.to.be.ok()
                expect(response.before).to.be true
                done()

    describe 'run() with filters', ->

        runner = null

        beforeEach ->
            runner = new ControllerRunner

        it 'should call before() method from all filters before calling the controller method in order', (done) ->
            order = []
            aFilter =
                before: (callback) ->
                    order.push 'a.before()'
                    callback()
            bFilter =
                before: (callback) ->
                    order.push 'b.before()'
                    callback(true)
            controller =
                method: 'get'
                filters: [aFilter, bFilter]
                get: (callback) ->
                    callback({})

            runner.run controller, 10000, (error, response) ->
                expect(error).not.to.be.ok()
                expect(order).to.eql ['a.before()', 'b.before()']
                expect(response).to.eql {}
                done()

        it 'should call after() method from all filters after calling the controller method in reverse order', (done) ->
            order = []
            aFilter =
                after: (callback) ->
                    order.push 'a.after()'
                    callback()
            bFilter =
                after: (callback) ->
                    order.push 'b.after()'
                    callback()
            controller =
                method: 'get'
                filters: [aFilter, bFilter]
                get: (callback) ->
                    callback({})

            runner.run controller, 10000, (error, response) ->
                expect(response).to.be.ok()
                expect(error).not.to.be.ok()
                expect(order).to.eql ['b.after()', 'a.after()']
                done()

        it 'should stop the filter chain if something is passed to the before() method of a filter', (done) ->
            aFilter =
                responseHeaders: {}
                before: (callback) ->
                    @statusCode = 403
                    @responseHeaders['X-Ha'] = 'X-Ha'
                    callback(message: 'NotAllowed')
            bFilter =
                responseHeaders: {}
                before: ->
                    expect.fail()
            controller =
                method: 'get'
                filters: [aFilter, bFilter]
                get: ->
                    expect.fail()

            runner.run controller, 10000, (error, response) ->
                expect(error).not.to.be.ok()
                expect(response.message).to.be 'NotAllowed'
                expect(controller.statusCode).to.be 403
                expect(controller.responseHeaders['X-Ha']).to.be 'X-Ha'
                done()

        it 'should stop the filter chain if an exception occurs in the before method of a filter', (done) ->
            aFilter =
                before: ->
                    throw name: 'MyError'
            bFilter =
                before: ->
                    expect.fail()
            controller =
                method: 'get'
                filters: [aFilter, bFilter]
                get: ->
                    expect.fail()

            runner.run controller, 10000, (error) ->
                expect(error.name).to.be('MyError')
                done()

        it 'should stop the filter chain if an exception occurs in the after method of a filter', (done) ->
            aFilter =
                after: ->
                    expect.fail()
            bFilter =
                after: ->
                    throw name: 'MyError'
            controller =
                method: 'get'
                filters: [aFilter, bFilter]
                get: (callback) ->
                    callback()

            runner.run controller, 10000, (error) ->
                expect(error.name).to.be 'MyError'
                done()
