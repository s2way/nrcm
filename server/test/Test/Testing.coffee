assert = require('assert')
Testing = require('../../src/Test/Testing')
RequestHandler = require('../../src/Controller/RequestHandler')
expect = require('expect.js')
path = require('path')

describe 'Testing', ->

    testing = null
    payload = null
    query = null
    segments = null

    RequestHandler::log = ->

    testing = null
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
        testing = new Testing('app')
        testing._exists = (filePath) ->
            filePath.indexOf('InvalidComponent') is -1

        testing._require = (filePath) ->
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

    describe 'createModel()', ->
        it 'should throw a ModelNotFound exception if the model does not exist', ->
            expect(->
                testing._exists = -> false
                testing.createModel 'InvalidModel'
            ).to.throwException (e) ->
                expect(e.name).to.be 'ModelNotFound'

        it 'should return the instance of a model', ->
            assert.equal 'MyModel', testing.createModel('MyModel').name

        it 'should return the model and then it should be possible to access MyComponent', ->
            myModel = testing.createModel('MyModel')
            testing.loadComponent 'MyComponent'
            assert.equal 'MyComponent', myModel.component('MyComponent').name

        it 'should return the model and then it should be possible to access AnotherModel', ->
            myModel = testing.createModel('MyModel')
            testing.loadModel 'AnotherModel'
            assert.equal 'AnotherModel', myModel.model('AnotherModel').name

        it 'should be able to load sub models', ->
            myModel = testing.createModel('Remote.MyModel')
            expect(myModel.name).to.be 'Remote.MyModel'

    describe 'createComponent()', ->
        it 'should throw a ComponentNotFound exception if the model does not exist', ->
            testing._exists = -> false
            expect(->
                testing.createComponent 'InvalidModel'
            ).to.throwException (e) ->
                expect(e.name).to.be 'ComponentNotFound'

        it 'should return the instance of a component', ->
            assert.equal 'MyComponent', testing.createComponent('MyComponent').name

        it 'should return the component and then it should be possible to access AnotherComponent', ->
            myComponent = testing.createComponent('MyComponent')
            testing.loadComponent 'AnotherComponent'
            assert.equal 'AnotherComponent', myComponent.component('AnotherComponent').name

        it 'should be able to load sub components', ->
            myComponent = testing.createComponent('Remote.MyComponent')
            expect(myComponent.name).to.be 'Remote.MyComponent'

    describe 'loadComponent()', ->
        it 'should throw an exception if the component cannot be found', ->
            try
                testing._exists = ->
                    false

                testing.loadComponent 'InvalidComponent'
                expect.fail()
            catch e
                expect(e.name).to.be.equal 'ComponentNotFound'

        it 'should be able to retrieve builtin components, like QueryBuilder', ->

            testing._exists = (filePath) -> filePath.indexOf('Builtin/QueryBuilder') isnt -1
            testing._require = -> require '../../src/Component/Builtin/QueryBuilder'
            expect(testing.loadComponent 'QueryBuilder').to.be true

    describe 'mockConfigs()', ->
        beforeEach ->
            testing.mockConfigs file:
                prop: 'value'

        it 'should inject the JSON into the models', ->
            model = testing.createModel('MyModel')
            expect(model.configs.file.prop).to.be 'value'

        it 'should inject the JSON into the components', ->
            component = testing.createComponent('MyComponent')
            expect(component.configs.file.prop).to.be 'value'

    describe 'callController()', ->

        it 'should mock the Model methods passed to mockModel when callController is called', (done) ->
            class MyController
                get: (callback) ->
                    myModel = @model('MyModel')
                    output = mocked: myModel.findById()
                    callback output
            class MyModel
                findById: -> 'no'

            testing._require = (filePath) ->
                return MyController if filePath is path.join('app', 'src', 'Controller', 'MyController')
                return MyModel if filePath is path.join('app', 'src', 'Model', 'MyModel')

            testing.mockModel 'MyModel', findById: -> 'yes'
            testing.callController 'MyController', 'get', {}, (body, info) ->
                expect(body.mocked).to.be 'yes'
                expect(info.statusCode).to.be 200
                expect(info.headers).to.be.ok()
                done()

        it 'should mock the Component methods passed to mockComponent when callController is called', (done) ->
            class MyController
                get: (callback) -> callback mocked: @component('MyComponent').util()
            class MyComponent
                util: -> 'no'

            testing._require = (filePath) ->
                return MyController if filePath is path.join('app', 'src', 'Controller', 'MyController')
                return MyComponent if filePath is path.join('app', 'src', 'Component', 'MyComponent')

            testing.mockComponent 'MyComponent', util: -> 'yes'
            testing.callController 'MyController', 'get', {}, (body, info) ->
                expect(body.mocked).to.be 'yes'
                expect(info.statusCode).to.be 200
                expect(info.headers).to.be.ok()
                done()


        it 'should be able to call sub controllers', (done) ->
            class MySubController
                get: (callback) -> callback name: @name

            testing._require = (filePath) ->
                return MySubController if filePath is path.join('app', 'src', 'Controller', 'Sub', 'MySubController')

            testing.callController 'Sub.MySubController', 'get', {}, (body, info) ->
                expect(body.name).to.be 'Sub.MySubController'
                expect(info.statusCode).to.be 200
                expect(info.headers).to.be.ok()
                done()

        it 'should call the controller method passing the URL segments', (done) ->
            segments = ['one', 'two']
            class MyController
                get: (callback) ->
                    callback segments: @segments

            testing._require = (filePath) ->
                return MyController if filePath is path.join('app', 'src', 'Controller', 'MyController')

            testing.callController 'MyController', 'get', {
                segments: segments
            }, (body, info) ->
                expect(body.segments).to.eql segments
                expect(info.statusCode).to.be 200
                expect(info.headers).to.be.ok()
                done()