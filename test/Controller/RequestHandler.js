/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it, beforeEach */
'use strict';
var RequestHandler = require('./../../src/Controller/RequestHandler.js');
var Router = require('./../../src/Core/Router.js');
var ModelFactory = require('./../../src/Model/ModelFactory.js');
var ComponentFactory = require('./../../src/Component/ComponentFactory.js');
var assert = require('assert');
var expect = require('expect.js');

describe('RequestHandler.js', function () {

    RequestHandler.prototype.log = function () { return; };
    RequestHandler.prototype.debug = function () { return; };
    RequestHandler.prototype.error = function () { return; };
    Router.prototype.info = function () { return; };
    ModelFactory.prototype.info = function () { return; };
    ComponentFactory.prototype.info = function () { return; };

    var controlVars = { };

    function MockExceptionsController() {
        this.onApplicationNotFound = function (callback) {
            controlVars.exception = 'ApplicationNotFound';
            this.statusCode = 404;
            callback({
                'code' : 404,
                'error' : 'ApplicationNotFound'
            });
        };

        this.onControllerNotFound = function (callback) {
            controlVars.exception = 'ControllerNotFound';
            this.statusCode = 404;
            callback({
                'code' : 404,
                'error' : 'ControllerNotFound'
            });
        };

        this.onMethodNotFound = function (callback) {
            controlVars.exception = 'MethodNotFound';
            this.statusCode = 404;
            callback({
                'code' : 404,
                'error' : 'MethodNotFound'
            });
        };

        this.onForbidden = function (callback) {
            controlVars.exception = 'Forbidden';
            this.statusCode = 403;
            callback({
                'code' : 403,
                'error' : 'Forbidden'
            });
        };

        this.onGeneral = function (callback, exception) {
            controlVars.exception = exception.name;
            this.statusCode = 500;
            if (exception.stack !== undefined) {
                console.log(exception.stack);
            }
            callback({
                'name' : 'General',
                'cause' : exception
            });
        };
    }

    function mockResponse() {
        return {
            'setHeader' : function () {
                controlVars.headersSet = true;
            },
            'writeHead' : function (code, type) {
                controlVars.code = code;
                controlVars.contentType = type['content-type'];
            },
            'write' : function () {
                controlVars.writeCalled = true;
            },
            'end' : function () {
                controlVars.endCalled = true;
            }
        };
    }

    function mockRequest(url, method) {
        return {
            'method' : method,
            'url' : url,
            'headers' : {
                'header' : 'value'
            },
            'on' : function (type, callback) {
                if (type === 'end') {
                    callback();
                } else if (type === 'data') {
                    callback('');
                }
            }
        };
    }

    function mockRequestHandler(controllers, components) {
        if (!controllers) {
            controllers = {
                MyController : function () {
                    this.models = ['MyModel'];
                    var that = this;
                    this.get = function (callback) {
                        this.responseHeaders['X-My-Header'] = 'My Value';
                        callback({
                            'a' : 'response'
                        });
                    };
                    this.before = function (callback) {
                        controlVars.beforeCalled = true;
                        callback();
                    };
                    this.after = function (callback) {
                        controlVars.afterCalled = true;
                        callback();
                    };
                    this.post = function (callback) {
                        that.responseHeaders.header = 'value';
                        var output = {
                            'message' : 'This should be rendered'
                        };
                        controlVars.output = output;
                        controlVars.controllerInstance = that;
                        if (that.component('MyComponent')) {
                            that.component('MyComponent').method(function () {
                                callback(output);
                            });
                        } else {
                            callback(output);
                        }
                    };
                }
            };
        }
        if (!components) {
            components = {
                MyComponent : function () {
                    this.method = function (callback) {
                        controlVars.componentMethodCalled = true;
                        callback();
                    };
                    this.destroy = function () {
                        controlVars.componentDestroyCalled = true;
                    };
                }
            };
        }
        var models = {
            'MyModel' : function () {
                this.type = 'My';
                this.validate = {};
                this.requires = {};
                this.locks = {};
                this.keys = {};
                this.bucket = 'bucket';
                this.method = function (callback) {
                    controlVars.modelMethodCalled = true;
                    callback();
                };
            },
            'HisModel' : function () {
                this.method = function () {
                    return;
                };
            }
        };

        var rh = new RequestHandler({
            'log' : function () { return; },
            'debug' : function () { return; }
        }, {
            'urlFormat' : '/#service/#version/$application/$controller'
        }, {
            'app' : {
                'configs' : { },
                'core' : {
                    'version' : '1.0.0',
                    'requestTimeout' : 1000,
                    'dataSources' : {
                        'default' : {
                            'type' : 'Mock',
                            'host' : '0.0.0.0',
                            'port' : '3298',
                            'index' : 'bucket'
                        }
                    }
                },
                'controllers' : controllers,
                'components' : components,
                'models' : models
            }
        }, MockExceptionsController, '0.0.1');
        rh.appName = 'app';
        return rh;
    }

    describe('RequestHandler', function () {
        var url = '/service/version/app/my_controller?x=1&y=2&z=3';
        var method = 'POST';

        describe('invokeController', function () {
            var requestHandler, instance, sendResponseCounter;

            beforeEach(function () {
                sendResponseCounter = 0;
                requestHandler = mockRequestHandler();
                requestHandler._endRequest = function (callback) {
                    callback();
                };
                requestHandler._receivePayload = function () {
                    return;
                };
                requestHandler._headers = function () {
                    return { };
                };
                requestHandler._setHeader = function () {
                    return;
                };
                requestHandler._writeHead = function () {
                    return;
                };
                requestHandler._writeResponse = function () {
                    return;
                };
                requestHandler._sendResponse = function () {
                    sendResponseCounter += 1;
                };
                instance = requestHandler.prepareController('MyController');
            });

            it('should destroy all components by calling their destroy() method if defined', function (done) {
                var destroyed = false;
                requestHandler.applications.app.components.MyComponent = function () {
                    this.method = function (callback) {
                        callback();
                    };
                    this.destroy = function () {
                        if (!destroyed) {
                            destroyed = true;
                            done();
                        }
                    };
                };
                requestHandler.invokeController(instance, 'post');
            });

            it('should throw a MethodNotFound exception if the method passed is not implemented inside the controller', function () {
                try {
                    requestHandler.invokeController(instance, 'put');
                } catch (e) {
                    assert.equal('MethodNotFound', e.name);
                }
            });

            it('should call the render method only once if the invokeController is called twice', function (done) {
                requestHandler.invokeController(instance, 'post', function () {
                    requestHandler.invokeController(instance, 'post', function () {
                        assert.equal(1, sendResponseCounter);
                        done();
                    });
                });
            });

            it('should call handleRequestException if an exception occurs in the controller after() callback', function (done) {
                var exception = {
                    'name' : 'MyExceptionObject'
                };
                instance.after = function () {
                    throw exception;
                };
                requestHandler.handleRequestException = function (e) {
                    assert.equal(exception, e);
                    done();
                };
                requestHandler.invokeController(instance, 'post');
            });

            it('should call the handleRequestException if an exception occurs in the controller before() callback', function (done) {
                var exception = {
                    'name' : 'MyExceptionObject'
                };
                instance.before = function () {
                    throw exception;
                };
                requestHandler.handleRequestException = function (e) {
                    assert.equal(exception, e);
                    done();
                };
                requestHandler.invokeController(instance, 'post');
            });

            it('should call the handleRequestException if an exception occurs in the controller method', function (done) {
                var exception = {
                    'prop' : 'value'
                };
                instance.post = function () {
                    throw exception;
                };
                requestHandler.handleRequestException = function (e) {
                    assert.equal(exception, e);
                    done();
                };
                requestHandler.invokeController(instance, 'post');
            });
        });

        describe('prepareController', function () {
            var requestHandler, instance;

            beforeEach(function () {
                requestHandler = mockRequestHandler();
                requestHandler.method = 'post';
                instance = requestHandler.prepareController('MyController');
            });

            it('should inject the automatic trace method implementation', function (done) {
                assert.equal('function', typeof instance.trace);
                instance.requestHeaders = {
                    'header' : 'value'
                };
                instance.trace(function () {
                    assert.equal('value', instance.responseHeaders.header);
                    done();
                });
            });

            it('should inject the automatic options method implementation', function (done) {
                var options = instance.options;
                instance.post = function (callback) {
                    callback({});
                };
                instance.get = function (callback) {
                    callback({});
                };
                assert.equal('function', typeof options);
                instance.options(function () {
                    assert.equal('HEAD,TRACE,OPTIONS,GET,POST', instance.responseHeaders.Allow);
                    done();
                });
            });

            it('should inject the automatic head method implementation', function () {
                assert.equal('function', typeof instance.head);
                instance.head(function () {
                    assert.equal('My Value', instance.responseHeaders['X-My-Header']);
                });
            });

            it('should inject the name property', function () {
                assert.equal('MyController', instance.name);
            });

            it('should inject the method (http) property', function () {
                assert.equal('post', instance.method);
            });

            it('should inject the application property', function () {
                assert.equal('app', instance.application);
            });

            it('should inject the core property', function () {
                assert.equal('object', typeof instance.core);
            });

            it('should inject the configs property', function () {
                assert.equal('object', typeof instance.configs);
            });

            it('should throw a ControllerNotFound exception if the controller does not exist', function () {
                try {
                    requestHandler.prepareController('InvalidController');
                    assert.fail();
                } catch (e) {
                    assert.equal('ControllerNotFound', e.name);
                }
            });
        });

        describe('process', function () {
            beforeEach(function () {
                controlVars = {};
            });

            it('should render a JSON with the application version when the application root is queried', function () {
                var rh = mockRequestHandler();
                rh.process(mockRequest('/p1/p2/app', 'get'), mockResponse());
                rh.render = function (output) {
                    assert.equal('1.0.0', output.version);
                    assert.equal('app', output.application);
                };
            });

            it('should render an empty response if the HEAD method is issued', function (done) {
                var rh = mockRequestHandler();
                rh._writeResponse = function (output) {
                    assert.equal('', output);
                    done();
                };
                rh.process(mockRequest('/p1/p2/app', 'head'), mockResponse());
            });

            it('should render a JSON with the NRCM version when the root is queried', function () {
                var rh = mockRequestHandler();
                rh.process(mockRequest('/p1/p2', 'get'), mockResponse());
                rh.render = function (output) {
                    assert.equal('0.0.1', output.version);
                };
            });

            it('should not parse the payload if it is an empty string', function (done) {
                var rh, request;
                rh = mockRequestHandler({
                    'MyController' : function () {
                        this.get = function () {
                            expect(this.payload).to.be(null);
                            done();
                        };
                    }
                });
                request =  {
                    'method' : 'GET',
                    'url' : '/service/version/app/my_controller',
                    'headers' : {
                        'content-type' : 'application/json'
                    },
                    'on' : function (type, callback) {
                        if (type === 'end') {
                            callback();
                        } else if (type === 'data') {
                            callback('');
                        }
                    }
                };
                rh.process(request, mockResponse());
            });

            it('should handle the InvalidUrl exception and render something', function () {
                var rh = mockRequestHandler();
                rh.process(mockRequest('/', 'get'), mockResponse());
                assert.equal('InvalidUrl', controlVars.exception);
            });

            it('should handle the ApplicationNotFound exception and render something', function () {
                var rh = mockRequestHandler();
                rh.process(mockRequest('/service/version/invalid_app/controller', method), mockResponse());
                assert.equal('ApplicationNotFound', controlVars.exception);
            });

            it('should allow the controller to retrieve components', function (done) {
                var rh = mockRequestHandler({
                    MyController : function () {
                        this.post = function (callback) {
                            var myComponent = this.component('MyComponent');
                            myComponent.method(callback);
                            assert(myComponent.component('MyComponent') !== undefined);
                        };
                    }
                });
                rh.render = function () {
                    done();
                };
                rh.process(mockRequest(url, method), mockResponse());
            });

            it('should allow the model to retrieve components', function (done) {
                var rh = mockRequestHandler({
                    MyController : function () {
                        this.post = function (callback) {
                            var myModel = this.model('MyModel');
                            var myComponent = myModel.component('MyComponent');
                            assert(myComponent !== null);
                            myComponent.method(callback);
                        };
                    }
                });
                rh.render = function () {
                    done();
                };
                rh.process(mockRequest(url, method), mockResponse());
            });

            it('should allow the controller to retrieve models', function (done) {
                var rh = mockRequestHandler({
                    MyController : function () {
                        this.post = function (callback) {
                            var model = this.model('MyModel');
                            assert.equal('MyModel', model.name);
                            assert.equal('My', model.type);
                            assert.equal('{}', JSON.stringify(model.validate));
                            assert.equal('{}', JSON.stringify(model.requires));
                            assert.equal('{}', JSON.stringify(model.locks));
                            assert.equal('{}', JSON.stringify(model.keys));
                            assert.equal('bucket', model.bucket);
                            assert.equal('function', typeof this.model('HisModel').method);
                            model.method(callback);
                        };
                    }
                });
                rh.render = function () {
                    done();
                };
                rh.process(mockRequest(url, method), mockResponse());
            });

            it('should invoke the controller and render if the url is valid', function (done) {
                var expectedRequestHeaders = {
                    'header' : 'value'
                };
                var expectedResponseHeaders = {
                    'Server' : 'WaferPie/0.0.1',
                    'header' : 'value'
                };
                var rh = mockRequestHandler({
                    MyController : function () {
                        this.post = function (callback) {
                            this.responseHeaders.header = 'value';
                            callback({});
                        };
                        this.after = function (callback) {
                            assert.equal(true, this.readonly.request !== undefined);
                            assert.equal(true, this.readonly.response !== undefined);
                            assert.equal(true, this.query !== undefined);
                            assert.equal(true, this.payload !== undefined);
                            assert.equal(true, this.segments !== undefined);
                            assert.equal(true, this.name !== undefined);
                            assert.equal(true, typeof this.component === 'function');
                            assert.equal(JSON.stringify(expectedRequestHeaders), JSON.stringify(this.requestHeaders));
                            assert.equal(JSON.stringify(expectedResponseHeaders), JSON.stringify(this.responseHeaders));
                            assert.equal('service', this.prefixes.service);
                            assert.equal('version', this.prefixes.version);
                            assert.equal('app', this.application);
                            callback();
                        };
                    }
                });
                rh.render = function (output, statusCode) {
                    assert(statusCode === 200);
                    assert(output !== null);
                    assert(controlVars.headersSet);
                    done();
                };
                rh.process(mockRequest(url, method), mockResponse());
            });

            it('should call before and after methods if they are defined', function (done) {
                var beforeCalled = true;
                var rh = mockRequestHandler({
                    MyController : function () {
                        this.post = function (callback) {
                            callback();
                        };
                        this.before = function (callback) {
                            beforeCalled = true;
                            callback(true);
                        };
                        this.after = function (callback) {
                            assert(callback !== null);
                            assert(beforeCalled === true);
                            done();
                        };
                    }
                });
                rh.process(mockRequest(url, method), mockResponse());
            });

            it('should handle the exception if the request timed out', function (done) {
                var rh = mockRequestHandler({
                    MyController : function () {
                        this.post = function (callback) {
                            assert(callback);
                        };
                    }
                });
                rh.applications[rh.appName].core.requestTimeout = 10;
                rh.render = function () {
                    assert.equal('Timeout', controlVars.exception);
                    done();
                };
                rh.process(mockRequest(url, method), mockResponse());
            });

            it('should handle the ControllerNotFound exception and render something', function () {
                var rh = mockRequestHandler();
                rh.process(mockRequest('/service/version/app/invalid_controller', method), mockResponse());
                assert.equal('ControllerNotFound', controlVars.exception);
            });

            it('should handle the MethodNotFound exception and render something', function () {
                var rh = mockRequestHandler();
                rh.process(mockRequest('/service/version/app/my_controller', 'PUT'), mockResponse());
                assert.equal('MethodNotFound', controlVars.exception);
            });

            it('should render the output JSON as XML if the contentType is text/xml', function (done) {
                var rh = mockRequestHandler({
                    'MyController' : function () {
                        this.get = function (callback) {
                            this.contentType = 'text/xml';
                            callback({
                                'root' : { }
                            });
                        };
                    }
                });
                rh._writeResponse = function (response) {
                    var xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<root/>';
                    expect(response).to.be(xml);
                    done();
                };
                rh.process(mockRequest('/service/version/app/my_controller', 'GET'), mockResponse());
            });

            it('should parse the payload as XML if the request content type is text/xml', function (done) {
                var xml, rh, request, expectedPayload;
                xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<root/>';
                expectedPayload = {
                    'root' : ''
                };
                rh = mockRequestHandler({
                    'MyController' : function () {
                        this.get = function () {
                            expect(
                                JSON.stringify(this.payload)
                            ).to.be(JSON.stringify(expectedPayload));
                            done();
                        };
                    }
                });
                request =  {
                    'method' : 'GET',
                    'url' : '/service/version/app/my_controller',
                    'headers' : {
                        'content-type' : 'text/xml'
                    },
                    'on' : function (type, callback) {
                        if (type === 'end') {
                            callback();
                        } else if (type === 'data') {
                            callback(xml);
                        }
                    }
                };
                rh.process(request, mockResponse());

            });


            it('should parse the payload as a query string if the request content type is application/x-www-form-urlencoded', function (done) {
                var urlEncoded, rh, request, expectedPayload;
                urlEncoded = 'key=something%20with%20spaces&prop=1';
                expectedPayload = {
                    'key' : 'something with spaces',
                    'prop' : '1'
                };
                rh = mockRequestHandler({
                    'MyController' : function () {
                        this.get = function () {
                            expect(
                                JSON.stringify(this.payload)
                            ).to.be(JSON.stringify(expectedPayload));
                            done();
                        };
                    }
                });
                request =  {
                    'method' : 'GET',
                    'url' : '/service/version/app/my_controller',
                    'headers' : {
                        'content-type' : 'application/x-www-form-urlencoded'
                    },
                    'on' : function (type, callback) {
                        if (type === 'end') {
                            callback();
                        } else if (type === 'data') {
                            callback(urlEncoded);
                        }
                    }
                };
                rh.process(request, mockResponse());
            });
        });

    });
});
