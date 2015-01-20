ElementManager = require './../../src/Core/ElementManager'
Tasker = require './../../src/Core/Tasker'
expect = require 'expect.js'

describe 'Tasker', ->

    describe 'run', ->

        application = null
        instance = null
        elementManager = null
        configs = {}
        core = {}

        class MyComponentWithTasker
            constructor: ->
                @execName = 'Test'
                @execInterval = 10
                @exec = (emiter) ->
                    emiter.emit 'success'

        class MyComponentWithoutTasker
            constructor: ->
                return

        beforeEach ->

        it 'should return 0 if there is no component with Tasker data ffa01', ->
            application =
                components: MyComponentWithoutTasker: MyComponentWithoutTasker
                name: 'App'
                configs: configs
                core: core
            elementManager = new ElementManager application
            instance = new Tasker application
            expect(instance.run()).to.be.equal 0

        it 'should return 1 if there is a component with Tasker data ffa02', ->
            application =
                components: MyComponentWithTasker: MyComponentWithTasker
                name: 'App'
                configs: configs
                core: core
            elementManager = new ElementManager application
            instance = new Tasker application
            expect(instance.run()).to.be.equal 1
