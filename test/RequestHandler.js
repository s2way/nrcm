/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it, beforeEach */
'use strict';
var RequestHandler = require('./../src/RequestHandler.js');
var exceptions = require('./../src/exceptions.js');
var assert = require('assert');

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
            'cause' : exception,
        });
    };
}

function mockResponse() {
    return {
        setHeader : function () {
            controlVars.headersSet = true;
        },
        writeHead : function (code, type) {
            controlVars.code = code;
            controlVars.contentType = type['Content-Type'];
        },
        write : function () {
            controlVars.writeCalled = true;
        },
        end : function () {
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
    if (controllers === undefined) {
        controllers = {
            MyController : function () {
                this.models = ['MyModel'];
                var that = this;
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
    if (components === undefined) {
        components = {
            MyComponent : function () {
                this.method = function (callback) {
                    controlVars.componentMethodCalled = true;
                    callback();
                };
            }
        };
    }
    var models = {
        'MyModel' : function () {
            this.uid = 'My';
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
        'dataSources' : {
            'default' : {
                'type' : 'Mock',
                'host' : '0.0.0.0',
                'port' : '3298',
                'index' : 'bucket'
            }
        },
        'urlFormat' : '/#service/#version/$application/$controller',
        'requestTimeout' : 500
    }, {
        'app' : {
            'controllers' : controllers,
            'components' : components,
            'models' : models
        }
    }, MockExceptionsController);
    rh.appName = 'app';
    rh.debug = rh.info = function () { return; };

    rh.isAllowed = function () {
        return '**';
    };
    return rh;
}

describe('RequestHandler.js', function () {

    describe('RequestHandler', function () {
        var url = '/service/version/app/my_controller?x=1&y=2&z=3';
        var method = 'POST';

        describe('invokeController', function () {
            var requestHandler, instance;

            beforeEach(function () {
                requestHandler = mockRequestHandler();
                instance = requestHandler.prepareController('MyController');
            });

            it('should throw a MethodNotFound exception if the method passed is not implemented inside the controller', function () {

                try {
                    requestHandler.invokeController(instance, 'put');
                } catch (e) {
                    assert.equal('MethodNotFound', e.name);
                }
            });

        });

        describe('prepareController', function () {
            var requestHandler, instance;

            beforeEach(function () {
                requestHandler = mockRequestHandler();
                instance = requestHandler.prepareController('MyController');
            });

            it('should inject the name property', function () {
                assert.equal('MyController', instance.name);
            });

            it('should inject the application property', function () {
                assert.equal('app', instance.application);
            });

            it('should inject the method for retrieving components', function () {
                var myComponent = instance.component('MyComponent');
                // Just to be sure that this component really is MyComponent
                assert.equal('MyComponent', myComponent.name);
            });

            it('should inject the method for retrieving models', function () {
                var myModel = instance.model('MyModel');
                // Just to be sure that this model really is MyModel
                assert.equal('MyModel', myModel.name);
            });

            it('should inject all ModelInterface methods inside the models retrieved by the model method', function () {
                var myModel = instance.model('MyModel');

                assert.equal('function', typeof myModel._findAll);
                assert.equal('function', typeof myModel._findByKey);
                assert.equal('function', typeof myModel._findById);
                assert.equal('function', typeof myModel._find);
                assert.equal('function', typeof myModel._removeById);
                assert.equal('function', typeof myModel._save);
            });

            it('should inject the method for retrieving models inside the models retrieved by the model method', function () {
                var myModel = instance.model('MyModel');
                // Retrieving itself
                assert.equal('MyModel', myModel.model('MyModel').name);
            });

            it('should inject the method for retrieving components inside the models retrieved by the model method', function () {
                var myModel = instance.model('MyModel');
                // Model retrieving a component
                assert.equal('MyComponent', myModel.component('MyComponent').name);
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

            it('should handle the InvalidUrl exception and render something', function () {
                var rh = mockRequestHandler();
                rh.isAllowed = function () { return '**'; };
                rh.process(mockRequest('/', 'get'), mockResponse());
                assert.equal('InvalidUrl', controlVars.exception);
            });

            it('should handle the ApplicationNotFound exception and render something', function () {
                var rh = mockRequestHandler();
                rh.isAllowed = function () { return '**'; };
                rh.process(mockRequest('/service/version/invalid_app/controller', method), mockResponse());
                assert.equal('ApplicationNotFound', controlVars.exception);
            });

            it('should allow the controller to retrieve components', function (done) {
                var rh = mockRequestHandler({
                    MyController : function () {
                        this.post = function (callback) {
                            var myComponent = this.component('MyComponent');
                            myComponent.method(callback);
                            // The component must be able to retrieve other components and itself!
                            assert(myComponent.component('MyComponent') !== undefined);

                        };
                    }
                });
                // Finaliza o teste após renderizar a resposta
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
                // Finaliza o teste após renderizar a resposta
                rh.render = function () {
                    done();
                };
                rh.process(mockRequest(url, method), mockResponse());
            });

            it('should inject the model interface methods (findById, save, ...) inside the models prefixed with an underscore', function (done) {
                var rh = mockRequestHandler({
                    MyController : function () {
                        this.post = function (callback) {
                            var model = this.model('MyModel');
                            assert.equal('function', typeof model._find);
                            assert.equal('function', typeof model._findById);
                            assert.equal('function', typeof model._findByKey);
                            assert.equal('function', typeof model._findAll);
                            assert.equal('function', typeof model._save);
                            assert.equal('function', typeof model._removeById);
                            model.method(callback);
                        };
                    }
                });
                // Finaliza o teste após renderizar a resposta
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
                            assert.equal('My', model.uid);
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
                // Finaliza o teste após renderizar a resposta
                rh.render = function () {
                    done();
                };
                rh.process(mockRequest(url, method), mockResponse());
            });

            it('should invoke the controller and render if the url is valid', function (done) {
                var expectedResponseAndRequestHeaders = {
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
                            assert.equal(true, this.name !== undefined);
                            assert.equal(true, typeof this.component === 'function');
                            assert.equal(JSON.stringify(expectedResponseAndRequestHeaders), JSON.stringify(this.requestHeaders));
                            assert.equal(JSON.stringify(expectedResponseAndRequestHeaders), JSON.stringify(this.responseHeaders));
                            assert.equal('service', this.prefixes.service);
                            assert.equal('version', this.prefixes.version);
                            assert.equal('app', this.application);
                            callback();
                        };
                    }
                });
                // Finaliza o teste após a execução do método render()
                rh.render = function (output, statusCode) {
                    assert(statusCode === 200);
                    assert(output !== null);
                    // Certifica-se que os headers foram setados
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
                            // Callback not called
                            // Timeout            
                            assert(callback);
                        };
                    }
                });
                rh.configs.requestTimeout = 10;
                rh.render = function () {
                    assert.equal('Timeout', controlVars.exception);
                    done();
                };
                rh.process(mockRequest(url, method), mockResponse());
            });

            it('should handle the exception if the resource is forbidden', function () {
                var rh = mockRequestHandler();
                rh.isAllowed = function () { return false; };
                rh.process(mockRequest(url, method), mockResponse());
                assert.equal('Forbidden', controlVars.exception);
            });

            it('should handle the ControllerNotFound exception and render something', function () {
                var rh = mockRequestHandler();
                rh.isAllowed = function () { return '**'; };
                rh.process(mockRequest('/service/version/app/invalid_controller', method), mockResponse());
                assert.equal('ControllerNotFound', controlVars.exception);
            });

            it('should handle the MethodNotFound exception and render something', function () {
                var rh = mockRequestHandler();
                rh.isAllowed = function () { return '**'; };
                rh.process(mockRequest('/service/version/app/my_controller', 'PUT'), mockResponse());
                assert.equal('MethodNotFound', controlVars.exception);
            });

        });
    });
});
