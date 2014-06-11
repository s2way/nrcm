var RequestHandler = require('./../src/RequestHandler.js');
var exceptions = require('./../src/exceptions.js');
var assert = require('assert');

var controlVars = {}

function mockResponse() {
    return {
        setHeader : function() {
            controlVars['headersSet'] = true;
        },
        writeHead : function(code, type) {
            controlVars['code'] = code;
            controlVars['contentType'] = type['Content-Type'];
        },
        write : function() {
            controlVars['writeCalled'] = true;
        },
        end : function() {
            controlVars['endCalled'] = true;
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
        'on' : function(type, callback) {
            if (type == 'end') {
                callback();
            } else if (type == 'data') {
                callback('');
            }
        }
    }
}

function mockRequestHandler(controllers, components) {
    if (controllers === undefined) {
        controllers = {
            MyController : function(){
                this.before = function(callback) {
                    controlVars['beforeCalled'] = true;
                    callback();
                }
                this.after = function(callback) {
                    controlVars['afterCalled'] = true;
                    callback();
                }
                this.post = function(callback) {
                    this.responseHeaders['header'] = 'value';
                    var output = {
                        'message' : 'This should be rendered'
                    }
                    controlVars['output'] = output;
                    controlVars['controllerInstance'] = this;
                    if (this.components !== undefined) {
                        this.components['MyComponent'].method(function(){
                            callback(output);
                        });
                    } else {
                        callback(output);
                    }
                };
            }
        };
    }
    if (components === undefined){
        components = {
            MyComponent : function() {
                this.method = function(callback) {
                    controlVars['componentMethodCalled'] = true;
                    callback();
                }
            }
        };
    }
    var rh = new RequestHandler({
        'urlFormat' : '/#service/#version/$application/$controller'
    }, {
        'app' : {
            'controllers' : controllers, 
            'components' : components
        }
    }, mockExceptionsController);
    rh.debug = rh.info = function(){};

    rh.isAllowed = function() {
        return '**';
    };
    return rh;
}

function mockExceptionsController() {
    this.onApplicationNotFound = function(callback) {
        controlVars['exception'] = 'ApplicationNotFound';
        this.statusCode = 404;
        callback({
            'code' : 404,
            'error' : 'ApplicationNotFound'
        });
    };

    this.onControllerNotFound = function(callback) {
        controlVars['exception'] = 'ControllerNotFound';
        this.statusCode = 404;
        callback({
            'code' : 404,
            'error' : 'ControllerNotFound'
        });
    };

    this.onMethodNotFound = function(callback) {
        controlVars['exception'] = 'MethodNotFound';
        this.statusCode = 404;
        callback({
            'code' : 404,
            'error' : 'MethodNotFound'
        });
    };

    this.onForbidden = function(callback) {
        controlVars['exception'] = 'Forbidden';
        this.statusCode = 403;
        callback({
            'code' : 403,
            'error' : 'Forbidden'
        });
    };

    this.onGeneral = function(callback, exception) {
        controlVars['exception'] = exception.name;
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

describe('RequestHandler.js', function(){
    describe('RequestHandler', function(){
        var url = '/service/version/app/my_controller?x=1&y=2&z=3';
        var method = 'POST';

        describe('process', function(){
            it('should handle the InvalidUrl exception and render something', function(){
                var rh = mockRequestHandler();
                rh.isAllowed = function(){ return '**'; };
                rh.process(mockRequest('/', 'get'), mockResponse());
                assert.equal('InvalidUrl', controlVars['exception']);
            });

            it('should handle the ApplicationNotFound exception and render something', function(){
                var rh = mockRequestHandler();
                rh.isAllowed = function() { return '**'; };
                rh.process(mockRequest('/service/version/invalid_app/controller', method), mockResponse());
                assert.equal('ApplicationNotFound', controlVars['exception']);
            });

            it('should allow access to components inside the controller', function(){
                controlVars = {};
                var rh = mockRequestHandler({
                    MyController : function(){
                        this.post = function(callback) {
                            this.components['MyComponent'].method(callback);
                        };
                    }
                });
                rh.process(mockRequest(url, method), mockResponse());
                assert.equal(true, controlVars['componentMethodCalled']);
            });

            it('should invoke the controller and render if the url is valid', function(){
                controlVars = {};
                var expectedResponseAndRequestHeaders = {
                    'header' : 'value'
                }
                var rh = mockRequestHandler();
                rh.process(mockRequest(url, method), mockResponse());
                assert.equal(true, controlVars['output'] !== null);
                assert.equal(true, controlVars['controllerInstance'].readonly.request !== undefined);
                assert.equal(true, controlVars['controllerInstance'].readonly.response !== undefined);
                assert.equal(true, controlVars['controllerInstance'].query !== undefined);
                assert.equal(true, controlVars['controllerInstance'].payload !== undefined);
                assert.equal(true, controlVars['controllerInstance'].name !== undefined);
                assert.equal(true, controlVars['controllerInstance'].components !== undefined);
                assert.equal(JSON.stringify(expectedResponseAndRequestHeaders), JSON.stringify(controlVars['controllerInstance'].requestHeaders));
                assert.equal(JSON.stringify(expectedResponseAndRequestHeaders), JSON.stringify(controlVars['controllerInstance'].responseHeaders));
                assert.equal('service', controlVars['controllerInstance'].prefixes['service']);
                assert.equal('version', controlVars['controllerInstance'].prefixes['version']);
                assert.equal('app', controlVars['controllerInstance'].application);
                // Certifica-se que os headers foram setados
                assert.equal(true, controlVars['headersSet']);
            });

            it('should call before and after methods if they are defined', function(){
                controlVars = {};
                var rh = mockRequestHandler();
                rh.process(mockRequest(url, method), mockResponse());
                assert.equal(true, controlVars['beforeCalled']);
                assert.equal(true, controlVars['afterCalled']);
            });

            it('should handle the exception if the resource is forbidden', function(){
                controlVars = {};
                var rh = mockRequestHandler();
                rh.isAllowed = function() { return false; };
                rh.process(mockRequest(url, method), mockResponse());
                assert.equal('Forbidden', controlVars['exception']);
            });

            it('should handle the ControllerNotFound exception and render something', function(){
                var rh = mockRequestHandler();
                rh.isAllowed = function() { return '**'; };
                rh.process(mockRequest('/service/version/app/invalid_controller', method), mockResponse());
                assert.equal('ControllerNotFound', controlVars['exception']);
            });

            it('should handle the MethodNotFound exception and render something', function(){
                var rh = mockRequestHandler();
                rh.isAllowed = function() { return '**'; };
                rh.process(mockRequest('/service/version/app/my_controller', 'PUT'), mockResponse());
                assert.equal('MethodNotFound', controlVars['exception']);
            });

        });
    });
});
