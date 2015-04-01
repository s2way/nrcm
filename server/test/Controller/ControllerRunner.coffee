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
            runner.run instance, 10000, ->
                expect().fail()

        it 'should call the after() callback if it is defined', (done) ->
            instance =
                filters: []
                method: 'get'
                get: (callback) ->
                    callback {}
                after: ->
                    done()
            runner.run instance, 10000, ->
                expect().fail()

        it 'should call the get() method if the instance has the method property defined as "get"', (done) ->
            instance =
                filters: []
                method: 'get'
                get: ->
                    done()
            runner.run instance, 10000, ->
                expect().fail()

        it 'should call the callback passing a Timeout exception if the timeout has occured', (done) ->
            instance =
                filters: []
                method: 'get'
                get: ->
            runner.run instance, 1, (e) ->
                expect(e.name).to.be 'Timeout'
                done()

        it 'should call the controller timeout method if the timeout expires', (done) ->
            beforeCalled = false

            instance =
                filters: []
                method: 'get'
                before: (callback) -> beforeCalled = true ; callback(true)
                after: -> expect().fail()
                get: ->
                afterTimeout: ->
                    expect(beforeCalled).to.be true
                    done()
            runner.run instance, 1, ->

        it 'should call the callback passing the error if an exception occurs in the after() method', (done) ->
            afterError = {}
            instance =
                filters: []
                method: 'get'
                get: (callback) ->
                    callback {}
                after: ->
                    setImmediate ->
                        throw afterError
            runner.run instance, 10000, (e) ->
                expect(e).to.be afterError
                done()

        it 'should call the callback passing the error if an exception occurs in the before() method', (done) ->
            beforeError = {}
            instance =
                filters: []
                before: ->
                    setImmediate ->
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

        it 'should call after() and it should be able to see the responseBody', (done) ->
            instance =
                filters: []
                method: 'get'
                before: (callback) -> callback true
                get: (callback) -> callback {}
                after: (callback) ->
                    expect(@responseBody).to.be.ok()
                    callback()
            runner.run instance, 10000, (error, response) ->
                expect(error).not.to.be.ok()
                expect(response).to.be.ok()
                done()

        it 'should allow changing the controller responseBody in after()', (done) ->
            instance =
                filters: []
                method: 'get'
                before: (callback) -> callback true
                get: (callback) -> callback response : 'body'
                after: (callback) ->
                    @body = newResponse : 'body'
                    callback()
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

        it 'should keep the same body in the filters after methods if no explicit change has been made', (done) ->
            expectedBody =
                controller : 'body'
            body = {}
            aFilter =
                after: (callback) ->
                    callback()
            bFilter =
                after: (callback) ->
                    callback()
            controller =
                method: 'get'
                filters: [aFilter, bFilter]
                get: (callback) ->
                    body.controller = 'body'
                    callback(body)

            runner.run controller, 10000, (error, response) ->
                expect(response).to.be.ok()
                expect(error).not.to.be.ok()
                expect(response).to.eql expectedBody
                done()

        it 'should allow body changes after the controller main method has set it', (done) ->
            expectedBody =
                controller : 'body'
                bFilter : 'body changed'
                aFilter : 'body changed'
            body = {}
            aFilter =
                after: (callback) ->
                    @body.aFilter = 'body changed'
                    callback()
            bFilter =
                after: (callback) ->
                    @body.bFilter = 'body changed'
                    callback()
            controller =
                method: 'get'
                filters: [aFilter, bFilter]
                get: (callback) ->
                    body.controller = 'body'
                    callback(body)

            runner.run controller, 10000, (error, response) ->
                expect(response).to.be.ok()
                expect(error).not.to.be.ok()
                expect(response).to.eql expectedBody
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
                    expect().fail()
            controller =
                method: 'get'
                filters: [aFilter, bFilter]
                get: ->
                    expect().fail()

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
                    expect().fail()
            controller =
                method: 'get'
                filters: [aFilter, bFilter]
                get: ->
                    expect().fail()

            runner.run controller, 10000, (error) ->
                expect(error.name).to.be('MyError')
                done()

        it 'should stop the filter chain if an exception occurs in the after method of a filter', (done) ->
            aFilter =
                after: ->
                    expect().fail()
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

        it 'should call all afterTimeout() methods if a timeout occurs within the controller method', (done) ->
            bTimeoutCalled = false

            aFilter =
                before: (callback) -> callback()
                afterTimeout: (callback) ->
                    expect(bTimeoutCalled).to.be true
                    callback()
                    done()
                after: ->
                    expect().fail()
            bFilter =
                before: (callback) -> callback()
                afterTimeout: (callback) ->
                    bTimeoutCalled = true
                    callback()
                after: ->
                    expect().fail()
            controller =
                method: 'get'
                filters: [aFilter, bFilter]
                get: ->

            runner.run controller, 10, (error) ->
                expect(error.name).to.be 'Timeout'

        it 'should not call controller.afterTimeout() if the controller.method() is not called', (done) ->
            aFilter =
                afterTimeout: (callback) ->
                    callback()
                    setImmediate ->
                        done()
                before: ->
                    # The callback is not called, so the controller.get() will never be called
                    # Therefore controller.afterTimeout() should also not be called!
            controller =
                afterTimeout: -> expect().fail()
                method: 'get'
                filters: [aFilter]
                get: -> expect().fail()

            runner.run controller, 100, (error) ->
                expect(error.name).to.be 'Timeout'

        it 'should not call bFilter.afterTimeout() if the aFilter.before() callback is not called', (done) ->
            aFilter =
                afterTimeout: (callback) ->
                    callback()
                    setImmediate ->
                        done()
                before: ->
                    # The callback is not called, so the B filter will never execute
                    # Therefore bFilter.afterTimeout() should also not be called!
            bFilter =
                afterTimeout: -> expect().fail()
            controller =
                method: 'get'
                filters: [aFilter, bFilter]
                get: -> expect().fail()

            runner.run controller, 100, (error) ->
                expect(error.name).to.be 'Timeout'


        it 'should call all afterError() methods if an exception occurs within the controller method', (done) ->
            bAfterError = false

            aFilter =
                before: (callback) -> callback()
                afterError: (callback) ->
                    expect(bAfterError).to.be true
                    callback()
                    done()
                after: -> expect().fail()
                afterTimeout: -> expect().fail()
            bFilter =
                before: (callback) -> callback()
                afterError: (callback) ->
                    bAfterError = true
                    callback()
                after: -> expect().fail()
                afterTimeout: -> expect().fail()
            controller =
                method: 'get'
                filters: [aFilter, bFilter]
                get: ->
                    setImmediate ->
                        throw name: 'MyError'
                after: -> expect().fail()

            runner.run controller, 10000, (error) ->
                expect(error.name).to.be 'MyError'

        it 'should not call controller.afterError() if an exception occurs within the filter', (done) ->
            aFilter =
                afterError: (callback) ->
                    callback()
                    setImmediate ->
                        done()
                before: ->
                    setImmediate ->
                        throw name: 'MyError'
            controller =
                afterError: -> expect().fail()
                method: 'get'
                filters: [aFilter]
                get: -> expect().fail()

            runner.run controller, 10000, (error) ->
                expect(error.name).to.be 'MyError'

        it 'should not call bFilter.afterError() if an exception occurs within the aFilter.before()', (done) ->
            aFilter =
                afterError: (callback) ->
                    callback()
                    setImmediate ->
                        done()
                    , 30
                before: ->
                    setImmediate ->
                        throw name: 'MyError'
            bFilter =
                afterTimeout: -> expect().fail()
            controller =
                method: 'get'
                filters: [aFilter, bFilter]
                get: -> expect().fail()

            runner.run controller, 10000, (error) ->
                expect(error.name).to.be 'MyError'
