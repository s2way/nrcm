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
                method: 'get'
                before: ->
                    done()
            runner.run instance, 1000, ->
                expect.fail()

        it 'should call the after() callback if it is defined', (done) ->
            instance =
                method: 'get'
                get: (callback) ->
                    callback {}
                after: ->
                    done()
            runner.run instance, 1000, ->
                expect.fail()

        it 'should call the get() method if the instance has the method property defined as "get"', (done) ->
            instance =
                method: 'get'
                get: ->
                    done()
            runner.run instance, 1000, ->
                expect.fail()

        it 'should call the callback passing a Timeout exception if the timeout has occured', (done) ->
            instance =
                method: 'get'
                get: ->
            runner.run instance, 1, (e) ->
                expect(e.name).to.be 'Timeout'
                done()


        it 'should call the callback passing the error if an exception occurs in the after() method', (done) ->
            afterError = {}
            instance =
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
                before: ->
                    throw beforeError
            runner.run instance, 10000, (e) ->
                expect(e).to.be beforeError
                done()

        it 'should call the callback passing the error if an exception occurs in the get() method', (done) ->
            getError = {}
            instance =
                method: 'get'
                get: -> throw getError
            runner.run instance, 10000, (e) ->
                expect(e).to.be getError
                done()

        it 'should call before(), get(), after() and pass the response to the callback', (done) ->
            instance =
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
                method: 'get'
                get: (callback) -> callback {}
            runner.run instance, 10000, (error, response) ->
                expect(error).not.to.be.ok()
                expect(response).to.be.ok()
                done()

        it 'should not call get() and after() if an exception occurs inside before()', (done) ->
            failed = false
            instance =
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
                method: 'get'
                before: (callback) -> callback (before: true)
                get: -> throw {}
            runner.run instance, 10000, (error, response) ->
                expect(error).not.to.be.ok()
                expect(response.before).to.be true
                done()
