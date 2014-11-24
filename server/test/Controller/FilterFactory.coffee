expect = require 'expect.js'
FilterFactory = require './../../src/Controller/FilterFactory'
ElementManager = require './../../src/Core/ElementManager'

describe 'FilterFactory', ->

    instance = null
    elementManager = null
    application =
        models:
            MyModel: ->
        components:
            MyComponent: ->
        filters:
            AnotherFilter: ->
            MyFilter: ->

    anotherFilterInstance = null
    myFilterInstance = null
    controllerInstance =
        name: 'MyController'
        method: 'get'
        query: {}
        segments: {}
        prefixes: {}
        payload: {}
        requestHeaders: {}
        url: {}
        configs: {}
        core: {}
        params: {}

    beforeEach ->
        elementManager = new ElementManager application
        instance = new FilterFactory application, elementManager
        [anotherFilterInstance, myFilterInstance] = instance.createForController controllerInstance

    describe 'createForController', ->

        it 'should inject the name property', ->
            expect(anotherFilterInstance.name).to.be 'AnotherFilter'
            expect(myFilterInstance.name).to.be 'MyFilter'

        it 'should inject the model() method', ->
            expect(myFilterInstance.model('MyModel').name).to.be 'MyModel'

        it 'should inject the component() method', ->
            expect(myFilterInstance.component('MyComponent').name).to.be 'MyComponent'

        it 'should inject the controller property', ->
            expect(myFilterInstance.controller).to.be 'MyController'

        it 'should inject the method property', ->
            expect(myFilterInstance.method).to.be 'get'

        it 'should inject the core property', ->
            expect(myFilterInstance.core).to.be.an('object')

        it 'should inject the configs property', ->
            expect(myFilterInstance.configs).to.be.an('object')

        it 'should inject the segments property', ->
            expect(myFilterInstance.segments).to.be.an('object')

        it 'should inject the query property', ->
            expect(myFilterInstance.query).to.be.ok()

        it 'should inject the prefixes property', ->
            expect(myFilterInstance.prefixes).to.be.ok()

        it 'should inject the url property', ->
            expect(myFilterInstance.url).to.be.ok()

        it 'should inject the payload property', ->
            expect(myFilterInstance.payload).to.be.ok()

        it 'should inject the requestHeaders property', ->
            expect(myFilterInstance.requestHeaders).to.be.ok()

        it 'should inject the responseHeaders property', ->
            expect(myFilterInstance.responseHeaders).to.be.ok()

        it 'should inject the params property', ->
            expect(myFilterInstance.params).to.eql {}

        it 'should inject the filters into the controllerInstance passed', ->
            expect(controllerInstance.filters).to.be.ok()