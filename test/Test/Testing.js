/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it, beforeEach */
'use strict';

var assert = require('assert');
var Testing = require('../../src/Test/Testing');
var ModelFactory = require('../../src/Model/ModelFactory');
var ComponentFactory = require('../../src/Component/ComponentFactory');
var RequestHandler = require('../../src/Controller/RequestHandler');

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

    beforeEach(function () {
        testing = new Testing('app', {
            'default' : {
                'type' : 'Couchbase',
                'host' : '0.0.0.0',
                'port' : '8091',
                'index' : 'index'
            }
        });
        testing._require = function (path) {
            if (path === 'app/src/Controller/MyController') {
                // Controller constructor
                return function () {
                    this.post = function (callback) {
                        callback({
                            'payload' : this.payload,
                            'query' : this.query
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
            if (path === 'app/src/Model/MyModel') {
                // Model constructor
                return function () {
                    this.uid = 'something';
                    this.myModelMethod = function (callback) {
                        callback({});
                    };
                };
            }
            if (path === 'app/src/Component/MyComponent') {
                // Component constructor
                return function () {
                    return;
                };
            }
            return null;
        };
    });

    describe('createModel', function () {

        it('should return the instance of a model', function () {
            assert.equal('MyModel', testing.createModel('MyModel').name);
        });
    });

    describe('createComponent', function () {

        it('should return the instance of a component', function () {
            assert.equal('MyComponent', testing.createComponent('MyComponent').name);
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

        it('should pass the status code, headers and content type to the callback function', function (done) {
            testing.callController('MyController', 'post', { }, function (response, info) {
                assert(response);
                assert.equal(200, info.statusCode);
                assert.equal('application/json', info.contentType);
                assert.equal('object', typeof info.headers);
                done();
            });

        });

        it('should access the payload as an empty string if it is not passed', function (done) {
            testing.loadComponent('MyComponent');
            testing.callController('MyController', 'post', { }, function (response) {
                assert.equal(JSON.stringify({}), JSON.stringify(response.payload));
                done();
            });
        });
    });

});