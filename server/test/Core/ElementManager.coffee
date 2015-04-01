expect = require('expect.js')
ElementManager = require('../../src/Core/ElementManager')

describe 'ElementManager', ->
    factory = null
    componentInstance = null
    modelInstance = null
    limbo = {}

    beforeEach ->
        factory = new ElementManager(
            limbo: limbo
            components: MyComponent: -> return
            models: MyModel: -> return
            configs: {}
            core: {}
            constants: {}
        )
        componentInstance = factory.create 'component', 'MyComponent'
        modelInstance = factory.create 'model', 'MyModel'

    describe 'init', ->
        it 'should call the init method if defined', (done) ->
            factory = new ElementManager(
                components:
                    MyComponent: ->
                        @init = -> done()
                        return
                constants: {}
            )
            componentInstance = factory.create 'component', 'MyComponent'
            factory.init componentInstance

        it 'should call the init method if the component() method is used to retrieve AnotherComponent', (done) ->
            factory = new ElementManager(
                components:
                    MyComponent: -> return
                    AnotherComponent: ->
                        @init = -> done()
                        return
                constants: {}
            )
            componentInstance = factory.create 'component', 'MyComponent'
            componentInstance.component 'AnotherComponent'

    describe 'destroy', ->

        it 'should call the destroy() function of all components returned by _getComponents()', (done) ->
            component = destroy: -> done()
            factory._getComponents = -> [component]
            factory.destroy()

        it 'should call the onError callback if an exception occurs in the component.destroy() method', (done) ->
            error = {}
            component = destroy: ->
                setTimeout ->
                    throw error
                , 50
            factory._getComponents = -> [component]
            factory.destroy((e) ->
                expect(e).to.be error
                done()
            )

    describe 'inject', ->

        it 'should perform injection into the component if the inject() method is specified', ->
            factory.inject = (name, type, instance) ->
                instance.myProperty = 1 if type is 'component' and name is 'MyComponent'

            componentInstance = factory.create('component', 'MyComponent')
            expect(componentInstance.myProperty).to.be 1
            factory.inject = undefined

        it 'should perform injection into the model if the inject() method is specified', ->
            factory.inject = (name, type, instance) ->
                instance.myProperty = 1 if type is 'component' and name is 'MyComponent'

            componentInstance = factory.create('component', 'MyComponent')
            expect(componentInstance.myProperty).to.be 1
            factory.inject = undefined

    describe 'create', ->
        describe 'model', ->
            it 'should not return the same instance if called twice', ->
                expect(modelInstance).not.to.be.equal factory.create('model', 'MyModel')

            it 'should create the model and inject the name property', ->
                expect(modelInstance.name).to.be 'MyModel'

            it 'should create the model and inject the limbo object', ->
                expect(modelInstance.limbo).to.be limbo

            it 'should create the model and inject the configs property', ->
                expect(modelInstance.configs).to.an 'object'

            it 'should inject the application constants', ->
                expect(modelInstance.constants).to.be.ok()

            it 'should inject the method for retrieving components', ->
                expect(modelInstance.component('InvalidComponent')).to.be null

            it 'should inject the method for retrieving models', ->
                myModel = modelInstance.model('MyModel')
                expect(myModel.name).to.be 'MyModel'
                expect(modelInstance.model('InvalidModel')).to.be null

            it 'should inject the method for retrieving models inside the models retrieved by the model method', ->
                expect(modelInstance.model('MyModel').model('MyModel').name).to.be 'MyModel'

        describe 'component', ->
            it 'should pass the params to the component constructor', (done) ->
                factory = new ElementManager(
                    components:
                        MyComponent: (params) ->
                            expect(params.key).to.be 'value'
                            done()
                            return
                    core: {}
                    constants: {}
                )
                componentInstance = factory.create('component', 'MyComponent',
                    key: 'value'
                )

            it 'should not return the same component componentInstance if called twice', ->
                anotherInstance = factory.create 'component', 'MyComponent'
                expect(componentInstance).not.to.be.equal anotherInstance

            it 'should create the component and inject the name property', ->
                expect(componentInstance.name).to.be 'MyComponent'

            it 'should inject the application constants', ->
                expect(componentInstance.constants).to.be.ok()

            it 'should create the model and inject the application core object (configurations)', ->
                expect(componentInstance.core).to.be.an 'object'

            it 'should create the model and inject the application configs object (all configuration files)', ->
                expect(componentInstance.configs).to.be.an 'object'

            it 'should inject the method for retrieving components', ->
                expect(componentInstance.component('InvalidComponent')).to.be null

            it 'should inject the method for retrieving components inside the components retrieved by the component method', ->
                expect(componentInstance.component('MyComponent').component('MyComponent').name).to.be 'MyComponent'

            it 'should inject the method for retrieving models', ->
                expect(componentInstance.model('InvalidModel')).to.be null

            it 'should always return the same componentInstance if the component is marked as static', ->
                MyComponent = -> return
                MyComponent.static = true

                factory = new ElementManager(
                    components: MyComponent: MyComponent
                    core: {}
                )
                componentInstance = factory.create('component', 'MyComponent')
                expect(factory.create('component', 'MyComponent')).to.be componentInstance
                expect(factory._getComponents()).to.have.length 1
                expect(factory._getComponents()).to.contain componentInstance

            it 'should always return a different componentInstance if the component is not marked as static', ->
                factory = new ElementManager(
                    components: MyComponent: -> return
                    core: {}
                )
                componentInstance = factory.create('component', 'MyComponent')
                componentInstance2 = factory.create('component', 'MyComponent')
                expect(componentInstance2).not.to.be componentInstance
                expect(factory._getComponents()).to.have.length 2
                expect(factory._getComponents()).to.contain componentInstance
                expect(factory._getComponents()).to.contain componentInstance2
