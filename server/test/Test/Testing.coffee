assert = require("assert")
Testing = require("../../src/Test/Testing")
RequestHandler = require("../../src/Controller/RequestHandler")
expect = require("expect.js")
path = require("path")

describe "Testing", ->

    testing = null
    payload = null
    query = null
    segments = null

    RequestHandler::log = ->

    testing = null
    payload =
        this: "is"
        a: "payload"

    query =
        this: "is"
        a: "query string"

    segments = [
        "action"
        "subaction"
    ]

    beforeEach ->
        testing = new Testing("app")
        testing._exists = (filePath) ->
            filePath.indexOf("InvalidComponent") is -1

        testing._require = (filePath) ->
            if filePath is path.join("app", "src", "Controller", "MyController") or filePath is path.join("app", "src", "Controller", "Remote", "MyController")
                return ->
                    @post = (callback) ->
                        callback
                            payload: @payload
                            query: @query
                            segments: @segments

                        return

                    @put = (callback) ->
                        model = @model("MyModel")
                        model.myModelMethod callback
                        return

                    this["delete"] = (callback) ->
                        model = @model("MyModel")
                        callback model.mockedMethod()
                        return

                    @get = (callback) ->
                        component = @component("MyComponent")
                        callback component.mockedMethod()
                        return

                    return
            if filePath is path.join("app", "src", "Model", "MyModel") or filePath is path.join("app", "src", "Model", "Remote", "MyModel")
                return ->
                    @type = "something"
                    @myModelMethod = (callback) ->
                        callback {}
                        return

                    return
            if filePath is path.join("app", "src", "Model", "AnotherModel")
                return ->
                    @type = "something-else"
                    return
            if filePath is path.join("app", "src", "Component", "MyComponent") or filePath is path.join("app", "src", "Component", "Remote", "MyComponent")
                return ->
                    return
            if filePath is path.join("app", "src", "Component", "AnotherComponent")
                return ->
                    return
            null

        return

    describe "createModel", ->
        it "should throw a ModelNotFound exception if the model does not exist", ->
            expect(->
                testing._exists = ->
                    false

                testing.createModel "InvalidModel"
                return
            ).to.throwException (e) ->
                expect(e.name).to.be "ModelNotFound"
                return

            return

        it "should return the instance of a model", ->
            assert.equal "MyModel", testing.createModel("MyModel").name
            return

        it "should return the model and then it should be possible to access MyComponent", ->
            myModel = testing.createModel("MyModel")
            testing.loadComponent "MyComponent"
            assert.equal "MyComponent", myModel.component("MyComponent").name
            return

        it "should return the model and then it should be possible to access AnotherModel", ->
            myModel = testing.createModel("MyModel")
            testing.loadModel "AnotherModel"
            assert.equal "AnotherModel", myModel.model("AnotherModel").name
            return

        it "should be able to load sub models", ->
            myModel = testing.createModel("Remote.MyModel")
            expect(myModel.name).to.be "Remote.MyModel"
            return

        return

    describe "createComponent", ->
        it "should throw a ComponentNotFound exception if the model does not exist", ->
            testing._exists = ->
                false

            expect(->
                testing.createComponent "InvalidModel"
                return
            ).to.throwException (e) ->
                expect(e.name).to.be "ComponentNotFound"
                return

            return

        it "should return the instance of a component", ->
            assert.equal "MyComponent", testing.createComponent("MyComponent").name
            return

        it "should return the component and then it should be possible to access AnotherComponent", ->
            myComponent = testing.createComponent("MyComponent")
            testing.loadComponent "AnotherComponent"
            assert.equal "AnotherComponent", myComponent.component("AnotherComponent").name
            return

        it "should be able to load sub components", ->
            myComponent = testing.createComponent("Remote.MyComponent")
            expect(myComponent.name).to.be "Remote.MyComponent"
            return

        return

    describe "loadComponent", ->
        it "should throw an exception if the component cannot be found", ->
            try
                testing._exists = ->
                    false

                testing.loadComponent "InvalidComponent"
                expect.fail()
            catch e
                expect(e.name).to.be.equal "ComponentNotFound"
            return

        it "should be able to retrieve builtin components, like QueryBuilder", ->
            testing._exists = (filePath) ->
                filePath.indexOf("QueryBuilder.js") isnt -1

            testing._require = ->
                require "../../src/Component/Builtin/QueryBuilder"

            name = "QueryBuilder"
            testing.loadComponent name
            queryBuilder = testing.components[name]
            expect(queryBuilder).to.be.a "function"
            return

        return

    describe "mockConfigs", ->
        beforeEach ->
            testing.mockConfigs file:
                prop: "value"

            return

        it "should inject the JSON into the models", ->
            model = testing.createModel("MyModel")
            expect(model.configs.file.prop).to.be "value"
            return

        it "should inject the JSON into the components", ->
            component = testing.createComponent("MyComponent")
            expect(component.configs.file.prop).to.be "value"
            return

        return

    describe "callController", ->
        it "should mock the Model methods passed to mockModel when callController is called", (done) ->
            dummy = a: "json"
            testing.mockModel "MyModel",
                mockedMethod: ->
                    dummy

            testing.callController "MyController", "delete", {}, (response) ->
                assert.equal JSON.stringify(dummy), JSON.stringify(response)
                done()
                return

            return

        it "should mock the Component methods passed to mockComponent when callController is called", (done) ->
            dummy = a: "json"
            testing.mockComponent "MyComponent",
                mockedMethod: ->
                    dummy

            testing.callController "MyController", "get", {}, (response) ->
                assert.equal JSON.stringify(dummy), JSON.stringify(response)
                done()
                return

            return

        it "should call the controller method", (done) ->
            testing.callController "MyController", "post",
                payload: payload
                query: query
            , (response) ->
                assert.equal JSON.stringify(payload), JSON.stringify(response.payload)
                assert.equal JSON.stringify(query), JSON.stringify(response.query)
                done()
                return

            return

        it "should call the controller method passing the URL segments", (done) ->
            testing.callController "MyController", "post",
                segments: segments
            , (response) ->
                assert.equal JSON.stringify(segments), JSON.stringify(response.segments)
                done()
                return

            return

        it "should pass the status code, headers and content type to the callback function", (done) ->
            testing.callController "MyController", "post", {}, (response, info) ->
                assert response
                assert.equal 200, info.statusCode
                assert.equal "application/json", info.contentType
                assert.equal "object", typeof info.headers
                done()
                return

            return

        it "should pass the options.prefixes to the controller.prefixes", (done) ->
            testing._require = (filePath) ->
                if filePath is path.join("app", "src", "Controller", "MyController")
                    ->
                        @get = (callback) ->
                            callback @prefixes
                            return

                        return

            testing.callController "MyController", "get",
                prefixes:
                    p1: "v1"
            , (response) ->
                expect(response.p1).to.be "v1"
                done()
                return

            return

        it "should set the payload to null if it is not passed", (done) ->
            testing.loadComponent "MyComponent"
            testing.callController "MyController", "post", {}, (response) ->
                expect(response.payload).to.be null
                done()
                return

            return

        it "should be able to call sub controllers", (done) ->
            testing.callController "Remote.MyController", "post", {}, ->
                done()
                return

            return

        return

    return
