assert = require('assert')
Loader = require('../../src/Util/Loader')
RequestHandler = require('../../src/Controller/RequestHandler')
expect = require('expect.js')
path = require('path')

describe 'Loader', ->

    loader = null
    payload = null
    query = null
    segments = null
    loader = null
    payload =
        this: 'is'
        a: 'payload'

    query =
        this: 'is'
        a: 'query string'

    segments = [
        'action'
        'subaction'
    ]

    beforeEach ->
        loader = new Loader('app')
        loader._exists = (filePath) ->
            filePath.indexOf('InvalidComponent') is -1

        loader._require = (filePath) ->
            if filePath is path.join('app', 'src', 'Model', 'MyModel') or filePath is path.join('app', 'src', 'Model', 'Remote', 'MyModel')
                return ->
                    @type = 'something'
                    @myModelMethod = (callback) ->
                        callback {}
                    return
            if filePath is path.join('app', 'src', 'Model', 'AnotherModel')
                return ->
                    @type = 'something-else'
            if filePath is path.join('app', 'src', 'Component', 'MyComponent') or filePath is path.join('app', 'src', 'Component', 'Remote', 'MyComponent')
                return ->
            if filePath is path.join('app', 'src', 'Component', 'AnotherComponent')
                return ->
            null

    it 'should load all builtin components automatically', ->
        expect(loader._components.QueryBuilder).to.a('function')

    describe 'createModel()', ->

        it 'should throw a ModelNotFound exception if the model does not exist', ->
            expect(->
                loader._exists = -> false
                loader.createModel 'InvalidModel'
            ).to.throwException (e) ->
                expect(e.name).to.be 'ModelNotFound'

        it 'should return the instance of a model', ->
            assert.equal 'MyModel', loader.createModel('MyModel').name

        it 'should return the model and then it should be possible to access MyComponent', ->
            myModel = loader.createModel('MyModel')
            loader.loadComponent 'MyComponent'
            assert.equal 'MyComponent', myModel.component('MyComponent').name

        it 'should return the model and then it should be possible to access AnotherModel', ->
            myModel = loader.createModel('MyModel')
            loader.loadModel 'AnotherModel'
            assert.equal 'AnotherModel', myModel.model('AnotherModel').name

        it 'should be able to load sub models', ->
            myModel = loader.createModel('Remote.MyModel')
            expect(myModel.name).to.be 'Remote.MyModel'

    describe 'createComponent()', ->
        it 'should throw a ComponentNotFound exception if the model does not exist', ->
            loader._exists = -> false
            expect(->
                loader.createComponent 'InvalidModel'
            ).to.throwException (e) ->
                expect(e.name).to.be 'ComponentNotFound'

        it 'should return the instance of a component', ->
            assert.equal 'MyComponent', loader.createComponent('MyComponent').name

        it 'should return the component and then it should be possible to access AnotherComponent', ->
            myComponent = loader.createComponent('MyComponent')
            loader.loadComponent 'AnotherComponent'
            assert.equal 'AnotherComponent', myComponent.component('AnotherComponent').name

        it 'should be able to load sub components', ->
            myComponent = loader.createComponent('Remote.MyComponent')
            expect(myComponent.name).to.be 'Remote.MyComponent'

    describe 'loadComponent()', ->
        it 'should throw an exception if the component cannot be found', ->
            try
                loader._exists = -> false
                loader.loadComponent 'InvalidComponent'
                expect.fail()
            catch e
                expect(e.name).to.be.equal 'ComponentNotFound'

        it 'should be able to retrieve builtin components, like QueryBuilder', ->
            loader._exists = (filePath) -> filePath.indexOf('Builtin/QueryBuilder') isnt -1
            loader._require = -> require '../../src/Component/Builtin/QueryBuilder'
            expect(loader.loadComponent 'QueryBuilder').to.be true


    describe 'loadFilter()', ->
        it 'should throw an exception if the filter cannot be found', ->
            expect(->
                loader._exists = -> false
                loader.loadFilter 'InvalidFilter'
            ).to.throwException((e) ->
                expect(e.name).to.be 'FilterNotFound'
            )

        it 'should be able to load a component and put it inside the application object', ->
            MyFilter = -> return
            loader._exists = (filePath) -> filePath.indexOf('Filter/MyFilter') isnt -1
            loader._require = -> MyFilter
            expect(loader.loadFilter 'MyFilter').to.be true
            expect(loader._application.filters.MyFilter).to.be MyFilter

        it 'should run the filter if callController() is called', (done) ->
            filterCalled = false
            class MyFilter
                before: (callback) ->
                    filterCalled = true
                    callback true

            class MyController
                get: (callback) -> callback {}

            loader._exists = -> true
            loader._require = (path) ->
                return MyFilter if path.indexOf('MyFilter') isnt -1
                return MyController if path.indexOf('MyController') isnt -1

            loader.loadFilter 'MyFilter'
            loader.callController 'MyController', 'get', {}, ->
                expect(filterCalled).to.be true
                done()

    describe 'mockConfigs()', ->
        beforeEach ->
            loader.mockConfigs file:
                prop: 'value'

        it 'should inject the JSON into the models', ->
            model = loader.createModel('MyModel')
            expect(model.configs.file.prop).to.be 'value'

        it 'should inject the JSON into the components', ->
            component = loader.createComponent('MyComponent')
            expect(component.configs.file.prop).to.be 'value'

    describe 'loadController()', ->

        it 'should throw an exception if the controller cannot be found', (done) ->
            expect(->
                loader._exists = -> false
                loader.loadController 'Invalid'
            ).to.throwException((e) ->
                expect(e.name).to.be 'ControllerNotFound'
                expect(e.controller).to.be 'Invalid'
                done()
            )
        it 'should load a DummyController specified if the second argument is passed', ->
            class DummyController
                constructor: ->
                get: (callback) ->
                    callback {}

            expect(loader.loadController 'DummyController', DummyController).to.be DummyController

    describe 'callController()', ->

        it 'should mock the Model methods passed to mockModel when callController is called', (done) ->
            class MyController
                get: (callback) ->
                    myModel = @model('MyModel')
                    output = mocked: myModel.findById()
                    callback output
            class MyModel
                findById: -> 'no'

            loader._exists = -> true
            loader._require = (filePath) ->
                return MyController if filePath is path.join('app', 'src', 'Controller', 'MyController.coffee')
                return MyModel if filePath is path.join('app', 'src', 'Model', 'MyModel')

            loader.mockModel 'MyModel', findById: -> 'yes'
            loader.callController 'MyController', 'get', {}, (body, info) ->
                expect(body.mocked).to.be 'yes'
                expect(info.statusCode).to.be 200
                expect(info.headers).to.be.ok()
                done()

        it 'should mock the Component methods passed to mockComponent when callController is called', (done) ->
            class MyController
                get: (callback) -> callback mocked: @component('MyComponent').util()
            class MyComponent
                util: -> 'no'

            loader._exists = -> true
            loader._require = (filePath) ->
                return MyController if filePath is path.join('app', 'src', 'Controller', 'MyController.coffee')
                return MyComponent if filePath is path.join('app', 'src', 'Component', 'MyComponent')

            loader.mockComponent 'MyComponent', util: -> 'yes'
            loader.callController 'MyController', 'get', {}, (body, info) ->
                expect(body.mocked).to.be 'yes'
                expect(info.statusCode).to.be 200
                expect(info.headers).to.be.ok()
                done()


        it 'should be able to call sub controllers', (done) ->
            class MySubController
                get: (callback) -> callback name: @name

            loader._require = (filePath) ->
                return MySubController if filePath is path.join('app', 'src', 'Controller', 'Sub', 'MySubController.coffee')

            loader.callController 'Sub.MySubController', 'get', {}, (body, info) ->
                expect(body.name).to.be 'Sub.MySubController'
                expect(info.statusCode).to.be 200
                expect(info.headers).to.be.ok()
                done()

        it 'should call the controller method passing the URL segments', (done) ->
            segments = ['one', 'two']
            class MyController
                get: (callback) ->
                    callback segments: @segments

            loader._require = (filePath) ->
                return MyController if filePath is path.join('app', 'src', 'Controller', 'MyController.coffee')

            loader.callController 'MyController', 'get', {
                segments: segments
            }, (body, info) ->
                expect(body.segments).to.eql segments
                expect(info.statusCode).to.be 200
                expect(info.headers).to.be.ok()
                done()

        it 'should call the controller method passing the query string', (done) ->
            query =
                one: 1
                two: 2
            class MyController
                get: (callback) ->
                    callback query: @query

            loader._require = (filePath) ->
                return MyController if filePath is path.join('app', 'src', 'Controller', 'MyController.coffee')

            loader.callController 'MyController', 'get', {
                query: query
            }, (body, info) ->
                expect(body.query).to.eql query
                expect(info.statusCode).to.be 200
                expect(info.headers).to.be.ok()
                done()


        it 'should call the controller and accept the callback() without parameters', (done) ->
            segments = ['one', 'two']
            class MyController
                get: (callback) -> callback()

            loader._require = (filePath) ->
                return MyController if filePath is path.join('app', 'src', 'Controller', 'MyController.coffee')

            loader.callController 'MyController', 'get', {
                segments: segments
            }, (body) ->
                expect(body).to.eql {}
                done()

        it 'should mock the Filter methods passed to mockFilter when callController is called', (done) ->
            class MyController
                get: (callback) ->
                    callback @params

            class MyFilter
                before: (callback) ->
                    @params.mocked = false
                    callback true

            loader._exists = -> true
            loader._require = (filePath) ->
                return MyController if filePath is path.join('app', 'src', 'Controller', 'MyController.coffee')
                return MyFilter if filePath is path.join('app', 'src', 'Filter', 'MyFilter')

            loader.mockFilter 'MyFilter', before: (callback) -> @params.mocked = true ; callback true
            loader.callController 'MyController', 'get', {}, (body) ->
                expect(body.mocked).to.be true
                done()

