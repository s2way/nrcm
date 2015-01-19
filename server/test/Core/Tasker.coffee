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

        class MyComponent
            constructor: -> return

        beforeEach ->
            application =
                components: MyComponent: MyComponent
                name: 'App'
                configs: configs
                core: core
            elementManager = new ElementManager application
            instance = new Tasker application

        it 'should return 0 if there is no component with Tasker data', ->
            expect(instance.run()).to.be.equal 0
