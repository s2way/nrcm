expect = require 'expect.js'
ControllerFactory = require './../../src/Controller/ControllerFactory'
ElementManager = require './../../src/Core/ElementManager'


describe 'ControllerFactory', ->

    describe 'create', ->

        application = null
        controllerFactory = null
        elementManager = null
        configs = {}
        core = {}

        class MyController
            constructor: -> return
        class MyComponent
            constructor: -> return
        class MyModel
            constructor: -> return

        beforeEach ->
            application =
                controllers: MyController: MyController
                models: MyModel: MyModel
                components: MyComponent: MyComponent
                name: 'App'
                configs: configs
                core: core
            elementManager = new ElementManager application
            controllerFactory = new ControllerFactory application, elementManager

        it 'should inject the elementManager', ->
            instance = controllerFactory.create 'MyController'
            expect(instance.elementManager).to.be.ok()

        it 'should inject the automatic options() implementation correctly', (done) ->
            instance = controllerFactory.create 'MyController'
            expect(instance.options).to.be.a 'function'
            instance.options ->
                expect(instance.responseHeaders['Allow']).to.be 'HEAD,TRACE,OPTIONS'
                expect(instance.responseHeaders['Content-Type']).not.to.be.ok()
                done()

        it 'should inject the head() method as a delegation to the get()', (done) ->
            instance = controllerFactory.create 'MyController'
            expect(instance.head).to.be.a 'function'
            instance.get = ->
                done()
            instance.head()

        it 'should inject the automatic trace() implementation correctly', ->
            instance = controllerFactory.create 'MyController'
            instance.requestHeaders = 'X-My-Header': 'value'
            expect(instance.trace).to.be.a 'function'
            instance.trace ->
                expect(instance.responseHeaders).to.eql instance.requestHeaders

        it 'should be able to retrieve components', ->
            instance = controllerFactory.create 'MyController'
            expect(instance.component('MyComponent').name).to.be 'MyComponent'

        it 'should be able to retrieve models', ->
            instance = controllerFactory.create 'MyController'
            expect(instance.model('MyModel').name).to.be 'MyModel'

        it 'should inject some informative properties', ->
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

    describe 'prepare', ->

        it 'should inject some basic information about the request into the controller instance', ->
            segments = {}
            query = {}
            prefixes = {}
            method = {}
            url = {}
            payload = {}
            requestHeaders = {}
            request =
                segments: segments
                method: method
                decomposedURL:
                    query: query
                    prefixes: prefixes
                url: url
                payload: payload
                headers: requestHeaders

            controller = {}

            application =
                controllers: {}
                models: {}
                components: {}
                configs: {}
                name: 'App'
                core: {}

            controllerFactory = new ControllerFactory application
            controllerFactory.prepare controller, request

            expect(controller.segments).to.be segments
            expect(controller.query).to.be query
            expect(controller.prefixes).to.be prefixes
            expect(controller.method).to.be method
            expect(controller.payload).to.be payload
            expect(controller.url).to.be url
            expect(controller.requestHeaders).to.be requestHeaders
            expect(controller.responseHeaders).to.be.ok()
            expect(controller.params).to.eql {}

