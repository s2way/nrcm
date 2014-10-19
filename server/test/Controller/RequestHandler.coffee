RequestHandler = require("./../../src/Controller/RequestHandler")
Router = require("./../../src/Core/Router")
assert = require("assert")
expect = require("expect.js")

describe "RequestHandler.js", ->
    MockExceptionsController = ->
        @onApplicationNotFound = (callback) ->
            controlVars.exception = "ApplicationNotFound"
            @statusCode = 404
            callback
                code: 404
                error: "ApplicationNotFound"
            return

        @onControllerNotFound = (callback) ->
            controlVars.exception = "ControllerNotFound"
            @statusCode = 404
            callback
                code: 404
                error: "ControllerNotFound"
            return

        @onMethodNotFound = (callback) ->
            controlVars.exception = "MethodNotFound"
            @statusCode = 404
            callback
                code: 404
                error: "MethodNotFound"
            return

        @onForbidden = (callback) ->
            controlVars.exception = "Forbidden"
            @statusCode = 403
            callback
                code: 403
                error: "Forbidden"
            return

        @onGeneral = (callback, exception) ->
            controlVars.exception = exception.name
            @statusCode = 500
            console.log exception.stack    if exception.stack isnt undefined
            callback
                name: "General"
                cause: exception
            return
        return
    mockResponse = ->
        setHeader: ->
            controlVars.headersSet = true
            return
        writeHead: (code, type) ->
            controlVars.code = code
            controlVars.contentType = type["content-type"]
            return
        write: ->
            controlVars.writeCalled = true
            return
        end: ->
            controlVars.endCalled = true
            return
    mockRequest = (url, method) ->
        method: method
        url: url
        headers:
            header: "value"

        on: (type, callback) ->
            if type is "end"
                callback()
            else callback ""    if type is "data"
            return
    mockRequestHandler = (controllers, components) ->
        unless controllers
            controllers = MyController: ->
                @models = ["MyModel"]
                that = this
                @get = (callback) ->
                    @responseHeaders["X-My-Header"] = "My Value"
                    callback a: "response"
                    return

                @before = (callback) ->
                    controlVars.beforeCalled = true
                    callback()
                    return

                @after = (callback) ->
                    controlVars.afterCalled = true
                    callback()
                    return

                @post = (callback) ->
                    that.responseHeaders.header = "value"
                    output = message: "This should be rendered"
                    controlVars.output = output
                    controlVars.controllerInstance = that
                    if that.component("MyComponent")
                        that.component("MyComponent").method ->
                            callback output
                            return
                    else
                        callback output
                    return
                return
        unless components
            components = MyComponent: ->
                @method = (callback) ->
                    controlVars.componentMethodCalled = true
                    callback()
                    return
                @destroy = ->
                    controlVars.componentDestroyCalled = true
                    return
                return
        models =
            MyModel: ->
                @type = "My"
                @validate = {}
                @requires = {}
                @locks = {}
                @keys = {}
                @bucket = "bucket"
                @method = (callback) ->
                    controlVars.modelMethodCalled = true
                    callback()
                    return
                return

            HisModel: ->
                @method = ->
                    return
                return

        rh = new RequestHandler(
            log: ->
                return
            debug: ->
                return
        ,
            urlFormat: "/#service/#version/$application/$controller"
        ,
            app:
                configs: {}
                core:
                    version: "1.0.0"
                    requestTimeout: 1000
                    dataSources:
                        default:
                            type: "Mock"
                            host: "0.0.0.0"
                            port: "3298"
                            index: "bucket"

                controllers: controllers
                components: components
                models: models
        , MockExceptionsController, "0.0.1")
        rh.appName = "app"
        rh
    RequestHandler::log = ->
        return
    RequestHandler::debug = ->
        return
    RequestHandler::error = ->
        return
    Router::info = ->
        return
    controlVars = {}

    describe "RequestHandler", ->
        url = "/service/version/app/my_controller?x=1&y=2&z=3"
        method = "POST"
        describe "invokeController", ->
            requestHandler = undefined
            instance = undefined
            sendResponseCounter = undefined
            beforeEach ->
                sendResponseCounter = 0
                requestHandler = mockRequestHandler()
                requestHandler._endRequest = (callback) ->
                    callback()
                requestHandler._receivePayload = ->
                requestHandler._headers = -> {}
                requestHandler._setHeader = ->
                requestHandler._writeHead = ->
                requestHandler._writeResponse = ->
                requestHandler._sendResponse = ->
                    sendResponseCounter += 1
                instance = requestHandler.prepareController("MyController")

            it "should destroy all components by calling their destroy() method if defined", (done) ->
                destroyed = false
                requestHandler.applications.app.components.MyComponent = ->
                    @method = (callback) ->
                        callback()
                    @destroy = ->
                        unless destroyed
                            destroyed = true
                            done()
                    return
                requestHandler.invokeController instance, "post"
                return

            it "should throw a MethodNotFound exception if the method passed is not implemented inside the controller", ->
                try
                    requestHandler.invokeController instance, "put"
                catch e
                    assert.equal "MethodNotFound", e.name
                return

            it "should call the render method only once if the invokeController is called twice", (done) ->
                requestHandler.invokeController instance, "post", ->
                    requestHandler.invokeController instance, "post", ->
                        assert.equal 1, sendResponseCounter
                        done()
                        return
                    return
                return

            it "should call handleRequestException if an exception occurs in the controller after() callback", (done) ->
                exception = name: "MyExceptionObject"
                instance.after = ->
                    throw exception
                    return
                requestHandler.handleRequestException = (e) ->
                    assert.equal exception, e
                    done()
                    return
                requestHandler.invokeController instance, "post"
                return

            it "should call the handleRequestException if an exception occurs in the controller before() callback", (done) ->
                exception = name: "MyExceptionObject"
                instance.before = ->
                    throw exception
                    return
                requestHandler.handleRequestException = (e) ->
                    assert.equal exception, e
                    done()
                    return
                requestHandler.invokeController instance, "post"
                return

            it "should call the handleRequestException if an exception occurs in the controller method", (done) ->
                exception = prop: "value"
                instance.post = ->
                    throw exception
                    return
                requestHandler.handleRequestException = (e) ->
                    assert.equal exception, e
                    done()
                    return
                requestHandler.invokeController instance, "post"
                return
            return

        describe "prepareController", ->
            requestHandler = undefined
            instance = undefined
            beforeEach ->
                requestHandler = mockRequestHandler()
                requestHandler.method = "post"
                instance = requestHandler.prepareController("MyController")
                return

            it "should inject the automatic trace method implementation", (done) ->
                assert.equal "function", typeof instance.trace
                instance.requestHeaders = header: "value"
                instance.trace ->
                    assert.equal "value", instance.responseHeaders.header
                    done()
                    return

                return

            it "should inject the automatic options method implementation", (done) ->
                options = instance.options
                instance.post = (callback) ->
                    callback {}
                    return

                instance.get = (callback) ->
                    callback {}
                    return

                assert.equal "function", typeof options
                instance.options ->
                    assert.equal "HEAD,TRACE,OPTIONS,GET,POST", instance.responseHeaders.Allow
                    done()
                    return

                return

            it "should inject the automatic head method implementation", ->
                assert.equal "function", typeof instance.head
                instance.head ->
                    assert.equal "My Value", instance.responseHeaders["X-My-Header"]
                    return

                return

            it "should inject the name property", ->
                assert.equal "MyController", instance.name
                return

            it "should inject the method (http) property", ->
                assert.equal "post", instance.method
                return

            it "should inject the application property", ->
                assert.equal "app", instance.application
                return

            it "should inject the core property", ->
                assert.equal "object", typeof instance.core
                return

            it "should inject the configs property", ->
                assert.equal "object", typeof instance.configs
                return

            it "should throw a ControllerNotFound exception if the controller does not exist", ->
                try
                    requestHandler.prepareController "InvalidController"
                    assert.fail()
                catch e
                    assert.equal "ControllerNotFound", e.name
                return

            return

        describe "process", ->
            beforeEach ->
                controlVars = {}
                return

            it "should render a JSON with the application version when the application root is queried", ->
                rh = mockRequestHandler()
                rh.process mockRequest("/p1/p2/app", "get"), mockResponse()
                rh.render = (output) ->
                    assert.equal "1.0.0", output.version
                    assert.equal "app", output.application
                    return

                return

            it "should render an empty response if the HEAD method is issued", (done) ->
                rh = mockRequestHandler()
                rh._writeResponse = (output) ->
                    assert.equal "", output
                    done()
                    return

                rh.process mockRequest("/p1/p2/app", "head"), mockResponse()
                return

            it "should render a JSON with the NRCM version when the root is queried", ->
                rh = mockRequestHandler()
                rh.process mockRequest("/p1/p2", "get"), mockResponse()
                rh.render = (output) ->
                    assert.equal "0.0.1", output.version
                    return

                return

            it "should not parse the payload if it is an empty string", (done) ->
                rh = undefined
                request = undefined
                rh = mockRequestHandler(MyController: ->
                    @get = ->
                        expect(@payload).to.be null
                        done()
                        return

                    return
                )
                request =
                    method: "GET"
                    url: "/service/version/app/my_controller"
                    headers:
                        "content-type": "application/json"

                    on: (type, callback) ->
                        if type is "end"
                            callback()
                        else callback ""    if type is "data"
                        return

                rh.process request, mockResponse()
                return

            it "should handle the InvalidUrl exception and render something", ->
                rh = mockRequestHandler()
                rh.process mockRequest("/", "get"), mockResponse()
                assert.equal "InvalidUrl", controlVars.exception
                return

            it "should handle the ApplicationNotFound exception and render something", ->
                rh = mockRequestHandler()
                rh.process mockRequest("/service/version/invalid_app/controller", method), mockResponse()
                assert.equal "ApplicationNotFound", controlVars.exception
                return

            it "should allow the controller to retrieve components", (done) ->
                rh = mockRequestHandler(MyController: ->
                    @post = (callback) ->
                        myComponent = @component("MyComponent")
                        myComponent.method callback
                        assert myComponent.component("MyComponent") isnt undefined
                        return

                    return
                )
                rh.render = ->
                    done()
                    return

                rh.process mockRequest(url, method), mockResponse()
                return

            it "should allow the model to retrieve components", (done) ->
                rh = mockRequestHandler(MyController: ->
                    @post = (callback) ->
                        myModel = @model("MyModel")
                        myComponent = myModel.component("MyComponent")
                        assert myComponent isnt null
                        myComponent.method callback
                        return

                    return
                )
                rh.render = ->
                    done()
                    return

                rh.process mockRequest(url, method), mockResponse()
                return

            it "should allow the controller to retrieve models", (done) ->
                rh = mockRequestHandler(MyController: ->
                    @post = (callback) ->
                        model = @model("MyModel")
                        assert.equal "MyModel", model.name
                        assert.equal "My", model.type
                        assert.equal "{}", JSON.stringify(model.validate)
                        assert.equal "{}", JSON.stringify(model.requires)
                        assert.equal "{}", JSON.stringify(model.locks)
                        assert.equal "{}", JSON.stringify(model.keys)
                        assert.equal "bucket", model.bucket
                        assert.equal "function", typeof @model("HisModel").method
                        model.method callback
                        return

                    return
                )
                rh.render = ->
                    done()
                    return

                rh.process mockRequest(url, method), mockResponse()
                return

            it "should invoke the controller and render if the url is valid", (done) ->
                expectedRequestHeaders = header: "value"
                expectedResponseHeaders =
                    Server: "WaferPie/0.0.1"
                    header: "value"

                rh = mockRequestHandler(MyController: ->
                    @post = (callback) ->
                        @responseHeaders.header = "value"
                        callback {}
                        return

                    @after = (callback) ->
                        assert.equal true, @query isnt undefined
                        assert.equal true, @payload isnt undefined
                        assert.equal true, @segments isnt undefined
                        assert.equal true, @name isnt undefined
                        assert.equal true, typeof @component is "function"
                        assert.equal JSON.stringify(expectedRequestHeaders), JSON.stringify(@requestHeaders)
                        assert.equal JSON.stringify(expectedResponseHeaders), JSON.stringify(@responseHeaders)
                        assert.equal "service", @prefixes.service
                        assert.equal "version", @prefixes.version
                        assert.equal "app", @application
                        callback()
                        return

                    return
                )
                rh.render = (output, statusCode) ->
                    expect(statusCode).to.be 200
                    expect(output).to.be.ok()
                    expect(controlVars.headersSet).to.be true
                    done()
                    return

                rh.process mockRequest(url, method), mockResponse()
                return

            it "should call before and after methods if they are defined", (done) ->
                beforeCalled = true
                rh = mockRequestHandler(MyController: ->
                    @post = (callback) ->
                        callback()
                        return

                    @before = (callback) ->
                        beforeCalled = true
                        callback true
                        return

                    @after = (callback) ->
                        assert callback isnt null
                        assert beforeCalled is true
                        done()
                        return

                    return
                )
                rh.process mockRequest(url, method), mockResponse()
                return

            it "should handle the exception if the request timed out", (done) ->
                rh = mockRequestHandler(MyController: ->
                    @post = (callback) ->
                        assert callback
                        return

                    return
                )
                rh.applications[rh.appName].core.requestTimeout = 10
                rh.render = ->
                    assert.equal "Timeout", controlVars.exception
                    done()
                    return

                rh.process mockRequest(url, method), mockResponse()
                return

            it "should handle the ControllerNotFound exception and render something", ->
                rh = mockRequestHandler()
                rh.process mockRequest("/service/version/app/invalid_controller", method), mockResponse()
                assert.equal "ControllerNotFound", controlVars.exception
                return

            it "should handle the MethodNotFound exception and render something", ->
                rh = mockRequestHandler()
                rh.process mockRequest("/service/version/app/my_controller", "PUT"), mockResponse()
                assert.equal "MethodNotFound", controlVars.exception
                return

            it "should render the output JSON as XML if the contentType is text/xml", (done) ->
                rh = mockRequestHandler(MyController: ->
                    @get = (callback) ->
                        @contentType = "text/xml"
                        callback root: {}
                        return

                    return
                )
                rh._writeResponse = (response) ->
                    xml = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n<root/>"
                    expect(response).to.be xml
                    done()
                    return

                rh.process mockRequest("/service/version/app/my_controller", "GET"), mockResponse()
                return

            it "should parse the payload as XML if the request content type is text/xml", (done) ->
                xml = undefined
                rh = undefined
                request = undefined
                expectedPayload = undefined
                xml = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n<root/>"
                expectedPayload = root: ""
                rh = mockRequestHandler(MyController: ->
                    @get = ->
                        expect(JSON.stringify(@payload)).to.be JSON.stringify(expectedPayload)
                        done()
                        return

                    return
                )
                request =
                    method: "GET"
                    url: "/service/version/app/my_controller"
                    headers:
                        "content-type": "text/xml"

                    on: (type, callback) ->
                        if type is "end"
                            callback()
                        else callback xml    if type is "data"
                        return

                rh.process request, mockResponse()
                return

            it "should parse the payload as a query string if the request content type is application/x-www-form-urlencoded", (done) ->
                urlEncoded = undefined
                rh = undefined
                request = undefined
                expectedPayload = undefined
                urlEncoded = "key=something%20with%20spaces&prop=1"
                expectedPayload =
                    key: "something with spaces"
                    prop: "1"

                rh = mockRequestHandler(MyController: ->
                    @get = ->
                        expect(JSON.stringify(@payload)).to.be JSON.stringify(expectedPayload)
                        done()
                        return

                    return
                )
                request =
                    method: "GET"
                    url: "/service/version/app/my_controller"
                    headers:
                        "content-type": "application/x-www-form-urlencoded"

                    on: (type, callback) ->
                        if type is "end"
                            callback()
                        else callback urlEncoded    if type is "data"
                        return

                rh.process request, mockResponse()
                return

            return

        return

    return
