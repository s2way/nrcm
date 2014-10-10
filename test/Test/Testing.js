/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it, beforeEach */
'use strict';

var assert = require('assert');
var Testing = require('../../src/Test/Testing');
var ModelFactory = require('../../src/Model/ModelFactory');
var ComponentFactory = require('../../src/Component/ComponentFactory');
var RequestHandler = require('../../src/Controller/RequestHandler');
var expect = require('expect.js');
var path = require('path');

describe('Testing', function () {

    ModelFactory.prototype.info = function () { return; };
    ComponentFactory.prototype.info = function () { return; };
    RequestHandler.prototype.info = function () { return; };

    var testing = null;
    var payload = {
        'this' : 'is',
        'a' : 'payload'
    };
    var query = {
        'this' : 'is',
        'a' : 'query string'
    };
    var segments = ['action', 'subaction'];

    beforeEach(function () {
        testing = new Testing('app');
        testing._exists = function (filePath) {
            return filePath.indexOf('InvalidComponent') === -1;
        };
        testing._require = function (filePath) {
            if (filePath === path.join('app', 'src', 'Controller', 'MyController') || filePath === path.join('app', 'src', 'Controller', 'Remote', 'MyController')) {
                return function () {
                    this.post = function (callback) {
                        callback({
                            'payload' : this.payload,
                            'query' : this.query,
                            'segments' : this.segments
                        });
                    };
                    this.put = function (callback) {
                        var model = this.model('MyModel');
                        model.myModelMethod(callback);
                    };
                    this.delete = function (callback) {
                        var model = this.model('MyModel');
                        callback(model.mockedMethod());
                    };
                    this.get = function (callback) {
                        var component = this.component('MyComponent');
                        callback(component.mockedMethod());
                    };
                };
            }
            if (filePath === path.join('app', 'src', 'Model', 'MyModel') || filePath === path.join('app', 'src', 'Model', 'Remote', 'MyModel')) {
                return function () {
                    this.type = 'something';
                    this.myModelMethod = function (callback) {
                        callback({});
                    };
                };
            }
            if (filePath === path.join('app', 'src', 'Model', 'AnotherModel')) {
                return function () {
                    this.type = 'something-else';
                    return;
                };
            }
            if (filePath === path.join('app', 'src', 'Component', 'MyComponent') || filePath === path.join('app', 'src', 'Component', 'Remote', 'MyComponent')) {
                return function () {
                    return;
                };
            }
            if (filePath === path.join('app', 'src', 'Component', 'AnotherComponent')) {
                return function () {
                    return;
                };
            }
            return null;
        };
    });

    describe('createModel', function () {

        it('should throw a ModelNotFound exception if the model does not exist', function () {
            expect(function () {
                testing._exists = function () {
                    return false;
                };
                testing.createModel('InvalidModel');
            }).to.throwException(function (e) {
                expect(e.name).to.be('ModelNotFound');
            });
        });

        it('should return the instance of a model', function () {
            assert.equal('MyModel', testing.createModel('MyModel').name);
        });

        it('should return the model and then it should be possible to access MyComponent', function () {
            var myModel = testing.createModel('MyModel');
            testing.loadComponent('MyComponent');
            assert.equal('MyComponent', myModel.component('MyComponent').name);
        });

        it('should return the model and then it should be possible to access AnotherModel', function () {
            var myModel = testing.createModel('MyModel');
            testing.loadModel('AnotherModel');
            assert.equal('AnotherModel', myModel.model('AnotherModel').name);
        });

        it('should be able to load sub models', function () {
            var myModel = testing.createModel('Remote.MyModel');
            expect(myModel.name).to.be('Remote.MyModel');
        });

    });

    describe('createComponent', function () {

        it('should throw a ComponentNotFound exception if the model does not exist', function () {
            testing._exists = function () {
                return false;
            };
            expect(function () {
                testing.createComponent('InvalidModel');
            }).to.throwException(function (e) {
                expect(e.name).to.be('ComponentNotFound');
            });
        });

        it('should return the instance of a component', function () {
            assert.equal('MyComponent', testing.createComponent('MyComponent').name);
        });

        it('should return the component and then it should be possible to access AnotherComponent', function () {
            var myComponent = testing.createComponent('MyComponent');
            testing.loadComponent('AnotherComponent');
            assert.equal('AnotherComponent', myComponent.component('AnotherComponent').name);
        });

        it('should be able to load sub components', function () {
            var myComponent = testing.createComponent('Remote.MyComponent');
            expect(myComponent.name).to.be('Remote.MyComponent');
        });

    });

    describe('loadComponent', function () {
        it('should throw an exception if the component cannot be found', function () {
            try {
                testing._exists = function () { return false; };
                testing.loadComponent('InvalidComponent');
                expect.fail();
            } catch (e) {
                expect(e.name).to.be.equal('ComponentNotFound');
            }
        });

        it('should be able to retrieve builtin components, like QueryBuilder', function () {
            testing._exists = function (filePath) {
                return filePath.indexOf('QueryBuilder.js') !== -1;
            };
            testing._require = function () {
                return require('../../src/Component/Builtin/QueryBuilder');
            };
            var name = 'QueryBuilder';
            testing.loadComponent(name);
            var queryBuilder = testing.components[name];
            expect(queryBuilder).to.be.a('function');
        });
    });

    describe('mockConfigs', function () {

        beforeEach(function () {
            testing.mockConfigs({
                'file' : {
                    'prop' : 'value'
                }
            });
        });

        it('should inject the JSON into the models', function () {
            var model = testing.createModel('MyModel');
            expect(model.configs.file.prop).to.be('value');
        });

        it('should inject the JSON into the components', function () {
            var component = testing.createComponent('MyComponent');
            expect(component.configs.file.prop).to.be('value');
        });

    });

    describe('callController', function () {

        it('should mock the Model methods passed to mockModel when callController is called', function (done) {
            var dummy = { 'a' : 'json' };
            testing.mockModel('MyModel', {
                'mockedMethod' : function () {
                    return dummy;
                }
            });
            testing.callController('MyController', 'delete', { }, function (response) {
                assert.equal(JSON.stringify(dummy), JSON.stringify(response));
                done();
            });
        });

        it('should mock the Component methods passed to mockComponent when callController is called', function (done) {
            var dummy = { 'a' : 'json' };
            testing.mockComponent('MyComponent', {
                'mockedMethod' : function () {
                    return dummy;
                }
            });
            testing.callController('MyController', 'get', { }, function (response) {
                assert.equal(JSON.stringify(dummy), JSON.stringify(response));
                done();
            });
        });

        it('should call the controller method', function (done) {

            testing.callController('MyController', 'post', {
                'payload' : payload,
                'query' : query
            }, function (response) {
                assert.equal(JSON.stringify(payload), JSON.stringify(response.payload));
                assert.equal(JSON.stringify(query), JSON.stringify(response.query));
                done();
            });

        });

        it('should call the controller method passing the URL segments', function (done) {

            testing.callController('MyController', 'post', {
                'segments' : segments
            }, function (response) {
                assert.equal(JSON.stringify(segments), JSON.stringify(response.segments));
                done();
            });

        });

        it('should pass the status code, headers and content type to the callback function', function (done) {
            testing.callController('MyController', 'post', { }, function (response, info) {
                assert(response);
                assert.equal(200, info.statusCode);
                assert.equal('application/json', info.contentType);
                assert.equal('object', typeof info.headers);
                done();
            });

        });

        it('should set the payload to null if it is not passed', function (done) {
            testing.loadComponent('MyComponent');
            testing.callController('MyController', 'post', { }, function (response) {
                expect(response.payload).to.be(null);
                done();
            });
        });

        it('should be able to call sub controllers', function (done) {
            testing.callController('Remote.MyController', 'post', { }, function () {
                done();
            });
        });
    });

});