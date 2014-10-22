expect = require 'expect.js'
ControllerFactory = require './../../src/Controller/ControllerFactory'

describe 'ControllerFactory', ->


    describe 'create', ->

        application = null
        controllerFactory = null
        configs = {}
        core = {}

        class MyController
            constructor: -> return

        beforeEach ->
            application =
                controllers: MyController: MyController
                name: 'App'
                configs: configs
                core: core
            controllerFactory = new ControllerFactory application

        it 'should instantiate the controller and inject the elementManager', ->
            instance = controllerFactory.create 'MyController'
            expect(instance.elementManager).to.be.ok()

        it 'should instantiate the controller and inject some informative properties', ->
            instance = controllerFactory.create 'MyController'
            expect(instance.name).to.be 'MyController'
            expect(instance.application).to.be 'App'
            expect(instance.configs).to.be configs
            expect(instance.core).to.be core
            expect(instance.responseHeaders).to.be.an 'object'
            expect(instance.component).to.be.a 'function'
            expect(instance.model).to.be.a 'function'
            expect(instance.head).to.be.a 'function'
            expect(instance.options).to.be.a 'function'
            expect(instance.trace).to.be.a 'function'


        it 'should throw a ControllerNotFound exception if the controller cannot be found', ->

            fn = ->
                controllerFactory.create 'InvalidController'
            expect(fn).to.throwException((e)->
                expect(e.name).to.be 'ControllerNotFound'
            )

    describe 'destroy', ->

        it 'should call destroy for all instantiated components', (done) ->
            class MyController
                constructor: -> return
            class MyComponent
                destroy: ->
                    done()

            application =
                controllers: MyController: MyController
                components: MyComponent: MyComponent
                name: 'App'
            controllerFactory = new ControllerFactory application
            instance = controllerFactory.create 'MyController'
            instance.component 'MyComponent'

            controllerFactory.destroy instance

